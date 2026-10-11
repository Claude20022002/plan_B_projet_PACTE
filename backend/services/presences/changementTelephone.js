import { UniqueConstraintError } from "sequelize";
import sequelize from "../../config/db.js";
import { AppareilEtudiant, DemandeTelephone, Users } from "../../models/index.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { journaliser } from "../journalSecurite.js";
import { creerNotification, creerNotificationsMultiples } from "../../utils/notificationHelper.js";
import { APPAREIL, empreinteAppareil } from "./appareil.js";

/**
 * Changement de téléphone (lot R-10). Un compte étudiant est lié à un seul téléphone pour l'appel
 * (services/presences/appel.js). Quand il en change, l'étudiant déclare le nouveau depuis
 * l'application, avec ce téléphone en main ; l'administration accepte ou refuse d'un geste.
 * Accepter lie le téléphone déclaré, et lui seul : un autre téléphone reste refusé au scan, la
 * protection contre la fraude reste donc entière. Chaque demande et chaque décision est gardée et
 * journalisée.
 */

const nomComplet = (u) => (u ? `${u.prenom} ${u.nom}` : null);

const exigerAdmin = (user) => {
    if (user.role !== "admin") throw new ErreurMetier("Réservé à l'administration", 403);
};

const telephoneDUnAutre = () => new ErreurMetier("Ce téléphone est lié au compte d'un autre étudiant : chacun pointe avec son propre téléphone.", 409);

const vueDemande = (d) => ({ id: d.id_demande, statut: d.statut, motif: d.motif ?? null, demandee_le: d.createdAt, decidee_le: d.decidee_le ?? null });

/**
 * L'étudiant déclare le téléphone qu'il tient en main (`appareil` : identifiant d'installation).
 * Une seule demande en attente par étudiant : une nouvelle déclaration la remplace.
 * Rend sa demande : { id, statut, motif, demandee_le, decidee_le }.
 */
export const demanderChangement = async (user, appareil, { motif } = {}, contexte = null) => {
    if (user.role !== "etudiant") throw new ErreurMetier("Réservé aux étudiants", 403);
    if (typeof appareil !== "string" || !APPAREIL.test(appareil)) throw new ErreurMetier("Faites la demande depuis l'application HESTIM, sur votre nouveau téléphone", 403);
    const empreinte = empreinteAppareil(appareil);
    const [duCompte, duTelephone] = await Promise.all([AppareilEtudiant.findByPk(user.id_user), AppareilEtudiant.findOne({ where: { appareil: empreinte } })]);
    // Sans téléphone lié, le prochain scan lie celui-ci : pas besoin de l'administration
    if (!duCompte) throw new ErreurMetier("Aucun téléphone n'est lié à votre compte : votre prochain scan liera celui-ci.", 409);
    if (duCompte.appareil === empreinte) throw new ErreurMetier("Ce téléphone est déjà celui de votre compte.", 409);
    if (duTelephone) throw telephoneDUnAutre();

    const texte = typeof motif === "string" && motif.trim() ? motif.trim().slice(0, 255) : null;
    const enAttente = await DemandeTelephone.findOne({ where: { id_user: user.id_user, statut: "en_attente" } });
    const demande = enAttente
        ? await enAttente.update({ appareil: empreinte, motif: texte })
        : await DemandeTelephone.create({ id_user: user.id_user, appareil: empreinte, motif: texte });
    await journaliser(contexte, { evenement: "telephone_demande", user });

    if (!enAttente) {
        const admins = await Users.findAll({ where: { role: "admin", actif: true }, attributes: ["id_user"] });
        if (admins.length) {
            await creerNotificationsMultiples({
                id_users: admins.map((a) => a.id_user),
                titre: "Changement de téléphone",
                message: `${nomComplet(user)} demande à pointer avec un nouveau téléphone.${texte ? ` Motif : ${texte}` : ""}`,
                type_notification: "info",
            });
        }
    }
    return vueDemande(demande);
};

/** Dernière demande de l'étudiant, ou null : { id, statut, motif, demandee_le, decidee_le }. */
export const maDemandeTelephone = async (user) => {
    if (user.role !== "etudiant") throw new ErreurMetier("Réservé aux étudiants", 403);
    const demande = await DemandeTelephone.findOne({ where: { id_user: user.id_user }, order: [["createdAt", "DESC"], ["id_demande", "DESC"]] });
    return demande ? vueDemande(demande) : null;
};

/**
 * Demandes à traiter (administration), les plus anciennes d'abord ; `statut` : « en_attente » par
 * défaut, « acceptee », « refusee » ou « toutes ». Chacune porte l'étudiant et la date à laquelle
 * son téléphone actuel a été lié.
 */
export const demandesTelephone = async (user, { statut = "en_attente" } = {}) => {
    exigerAdmin(user);
    const statuts = { en_attente: ["en_attente"], acceptee: ["acceptee"], refusee: ["refusee"], toutes: ["en_attente", "acceptee", "refusee"] }[statut];
    if (!statuts) throw new ErreurMetier("Statut inconnu", 400);
    const demandes = await DemandeTelephone.findAll({
        where: { statut: statuts },
        include: [
            { model: Users, as: "etudiant", attributes: ["id_user", "nom", "prenom", "email"] },
            { model: Users, as: "admin", attributes: ["nom", "prenom"] },
        ],
        order: [["createdAt", "ASC"], ["id_demande", "ASC"]],
        limit: 200,
    });
    const telephones = await AppareilEtudiant.findAll({ where: { id_user: [...new Set(demandes.map((d) => d.id_user))] }, attributes: ["id_user", "lie_le"] });
    const lieLe = new Map(telephones.map((t) => [t.id_user, t.lie_le]));
    return demandes.map((d) => ({
        ...vueDemande(d),
        etudiant: { id_user: d.id_user, nom: nomComplet(d.etudiant), email: d.etudiant?.email ?? null },
        telephone_lie_le: lieLe.get(d.id_user) ?? null,
        decidee_par: nomComplet(d.admin),
    }));
};

/**
 * Accepter (`accepter` vrai) ou refuser une demande en attente (administration). Accepter remplace
 * le téléphone lié par celui de la demande. Rend la demande décidée.
 */
export const deciderDemande = async (user, idDemande, accepter, { motif } = {}, contexte = null, maintenant = new Date()) => {
    exigerAdmin(user);
    const demande = Number.isInteger(idDemande) && idDemande > 0 ? await DemandeTelephone.findByPk(idDemande, { include: [{ model: Users, as: "etudiant", attributes: ["id_user", "role"] }] }) : null;
    if (!demande || demande.etudiant?.role !== "etudiant") throw new ErreurMetier("Demande introuvable", 404);
    if (demande.statut !== "en_attente") throw new ErreurMetier("Cette demande a déjà été traitée", 409);

    const decision = { statut: accepter ? "acceptee" : "refusee", id_user_admin: user.id_user, decidee_le: maintenant };
    if (accepter) {
        try {
            await sequelize.transaction(async (transaction) => {
                // Lié entre-temps à un autre compte (premier scan d'un camarade) : la demande attend
                const pris = await AppareilEtudiant.findOne({ where: { appareil: demande.appareil }, transaction });
                if (pris && pris.id_user !== demande.id_user) throw telephoneDUnAutre();
                await AppareilEtudiant.destroy({ where: { id_user: demande.id_user }, transaction });
                await AppareilEtudiant.create({ id_user: demande.id_user, appareil: demande.appareil, lie_le: maintenant }, { transaction });
                await demande.update(decision, { transaction });
            });
        } catch (erreur) {
            if (erreur instanceof UniqueConstraintError) throw telephoneDUnAutre();
            throw erreur;
        }
    } else {
        await demande.update(decision);
    }

    const raison = typeof motif === "string" && motif.trim() ? motif.trim().slice(0, 255) : null;
    await journaliser(contexte, {
        evenement: accepter ? "telephone_change_accepte" : "telephone_change_refuse",
        id_user: demande.id_user,
        acteur: user,
        ...(raison ? { details: { motif: raison } } : {}),
    });
    await creerNotification({
        id_user: demande.id_user,
        titre: accepter ? "Nouveau téléphone accepté" : "Changement de téléphone refusé",
        message: accepter
            ? "Votre nouveau téléphone est lié à votre compte : pointez désormais avec lui."
            : `Votre demande de changement de téléphone a été refusée.${raison ? ` Motif : ${raison}` : ""} Pointez avec votre téléphone habituel, ou adressez-vous à l'administration.`,
        type_notification: accepter ? "success" : "warning",
    });
    return vueDemande(demande);
};
