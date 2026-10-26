import { AuthSession, Desactivation, PasswordResetToken, PushToken } from "../../models/index.js";
import sequelize from "../../config/db.js";
import { ErreurMetier } from "../planning/enseignements.js";
import { aujourdhui } from "../planning/affectationRules.js";
import { enregistrerSeance, notifierChangementSeance } from "../planning/seances.js";
import { journaliser } from "../journalSecurite.js";
import { compteOuErreur, dateEffet, motifValide, seancesFutures, verifierCible } from "./regles.js";

/**
 * Désactivation des comptes par l'administration (plan multi-établissements, fichier 11, § 11.2,
 * lot ME-17). Une désactivation est immédiate ou programmée ; elle ne s'applique jamais tant
 * qu'un enseignant a des séances à venir que personne n'a traitées (confiées à un remplaçant par
 * les imprévus, ou annulées ici à la demande). Rien n'est supprimé : l'historique reste.
 */

const historique = (user, action, { motif = null, effet_le = null, acteur = null, details = null } = {}, transaction) =>
    Desactivation.create({ id_user: user.id_user, action, motif, effet_le, id_auteur: acteur?.id_user ?? null, details }, { transaction });

/**
 * Effets d'une désactivation, dans une transaction : compte coupé (chaque requête le revérifie
 * déjà), sessions fermées, jetons de notification de ses appareils retirés, liens d'invitation et
 * de réinitialisation en attente annulés. Le lien d'agenda refuse déjà les comptes désactivés.
 */
export const appliquerEffets = async (user, transaction) => {
    await user.update({ actif: false, desactivation_prevue_le: null, preavis_envoye_le: null }, { transaction });
    await AuthSession.update({ revoked_at: new Date(), revoked_reason: "desactivation" }, { where: { id_user: user.id_user, revoked_at: null }, transaction });
    await PushToken.destroy({ where: { id_user: user.id_user }, transaction });
    await PasswordResetToken.destroy({ where: { id_user: user.id_user }, transaction });
};

/** Annule les séances à venir d'un enseignant (choix explicite de l'administration), avec avis aux étudiants. */
const annulerSeances = async (seances, acteur) => {
    for (const s of seances) {
        const { affectation } = await enregistrerSeance({ id: s.id_affectation, donnees: { statut: "annule", commentaire: "Annulée : enseignant parti" }, user: acteur });
        await notifierChangementSeance({
            affectation: affectation.get({ plain: true }),
            titre: "Séance annulée",
            message: `La séance du ${s.date_seance} est annulée. Un rattrapage sera proposé.`,
            notifierEnseignant: false,
        });
    }
    return seances.length;
};

/**
 * Désactive un compte, tout de suite ou à une date. `seances: "annuler"` annule les séances à
 * venir de l'enseignant ; sans ce choix, une désactivation qui laisserait des séances orphelines
 * est refusée (409, SEANCES_A_TRAITER) : l'aperçu les liste, les imprévus proposent un remplaçant.
 */
export const desactiver = async (acteur, idUser, { motif, date, preavis = true, seances = null } = {}, contexte = null) => {
    const effet = dateEffet(date);
    motifValide(motif);
    const user = await compteOuErreur(idUser);
    if (!user.actif) throw new ErreurMetier("Ce compte est déjà désactivé", 409, "DEJA_DESACTIVE");
    if (user.anonymise_le) throw new ErreurMetier("Ce compte est anonymisé", 409, "ANONYMISE");
    await verifierCible(acteur, user);

    const futures = user.role === "enseignant" ? await seancesFutures(user.id_user, effet) : [];
    if (futures.length && seances !== "annuler") {
        throw new ErreurMetier(`${futures.length} séance(s) à venir de cet enseignant : confiez-les à un remplaçant ou choisissez de les annuler`, 409, "SEANCES_A_TRAITER");
    }
    const annulees = futures.length ? await annulerSeances(futures, acteur) : 0;

    if (effet === aujourdhui()) {
        await sequelize.transaction(async (transaction) => {
            await verifierCible(acteur, user, { transaction });
            await appliquerEffets(user, transaction);
            await historique(user, "desactivation", { motif, effet_le: effet, acteur, details: annulees ? { seances_annulees: annulees } : null }, transaction);
        });
        await journaliser(contexte, { evenement: "compte_desactive", user, acteur, details: { motif, seances_annulees: annulees } });
        return { statut: "desactive", effet_le: effet, seances_annulees: annulees };
    }

    await sequelize.transaction(async (transaction) => {
        await user.update({ desactivation_prevue_le: effet, desactivation_motif: motif, desactivation_preavis: Boolean(preavis), preavis_envoye_le: null }, { transaction });
        await historique(user, "programmation", { motif, effet_le: effet, acteur, details: { preavis: Boolean(preavis), seances_annulees: annulees } }, transaction);
    });
    await journaliser(contexte, { evenement: "desactivation_programmee", user, acteur, details: { motif, effet_le: effet } });
    return { statut: "programmee", effet_le: effet, preavis: Boolean(preavis), seances_annulees: annulees };
};

/** Annule une désactivation programmée qui n'a pas encore eu lieu. */
export const annulerProgrammation = async (acteur, idUser, contexte = null) => {
    const user = await compteOuErreur(idUser);
    if (!user.actif || !user.desactivation_prevue_le) throw new ErreurMetier("Aucune désactivation programmée pour ce compte", 409, "RIEN_A_ANNULER");
    const effet = user.desactivation_prevue_le;
    await sequelize.transaction(async (transaction) => {
        await user.update({ desactivation_prevue_le: null, desactivation_motif: null, preavis_envoye_le: null }, { transaction });
        await historique(user, "annulation", { effet_le: effet, acteur }, transaction);
    });
    await journaliser(contexte, { evenement: "desactivation_annulee", user, acteur, details: { effet_le: effet } });
    return { statut: "actif" };
};

/** Réactive un compte désactivé : rien n'est perdu, la personne se reconnecte. */
export const reactiver = async (acteur, idUser, contexte = null) => {
    const user = await compteOuErreur(idUser);
    if (user.anonymise_le) throw new ErreurMetier("Un compte anonymisé ne se réactive pas : créez-en un nouveau", 409, "ANONYMISE");
    if (user.actif) throw new ErreurMetier("Ce compte est déjà actif", 409, "DEJA_ACTIF");
    await sequelize.transaction(async (transaction) => {
        await user.update({ actif: true, desactivation_prevue_le: null, desactivation_motif: null, preavis_envoye_le: null }, { transaction });
        await historique(user, "reactivation", { acteur }, transaction);
    });
    await journaliser(contexte, { evenement: "compte_reactive", user, acteur });
    return { statut: "actif", a_verifier: user.role === "enseignant" ? "services et séances de l'année en cours" : user.role === "etudiant" ? "groupes de l'année en cours" : null };
};

/**
 * Changement du champ `actif` par la fenêtre de modification d'un compte (PUT /api/users/:id) :
 * passe par les mêmes règles que les actions dédiées (soi-même, dernier administrateur, séances à
 * traiter, sessions fermées), avec le motif « autre » et un effet immédiat.
 */
export const changerActif = async (acteur, user, valeur, contexte = null) => {
    const voulu = valeur === true || valeur === "true" || valeur === 1 || valeur === "1";
    if (voulu === Boolean(user.actif)) return null;
    return voulu ? reactiver(acteur, user.id_user, contexte) : desactiver(acteur, user.id_user, { motif: "autre" }, contexte);
};
