import { Op } from "sequelize";
import sequelize from "../../config/db.js";
import {
    Affectation,
    CompetenceEnseignant,
    Cours,
    Creneau,
    Disponibilite,
    Enseignant,
    Filiere,
    Groupe,
    Salle,
    Users,
} from "../../models/index.js";
import { ErreurMetier } from "./enseignements.js";
import { STATUTS_ACTIFS, seChevauchent, validerAffectation } from "./affectationRules.js";
import { occupationsDuJour } from "./occupations.js";
import { disponibiliteEnseignant } from "./enseignants.js";
import { enregistrerSeance, notifierChangementSeance } from "./seances.js";
import { notifierAdministrateurs } from "../../utils/notificationHelper.js";

/**
 * Imprévus du semestre (phase P6) : absence d'un enseignant (remplaçant ou rattrapage), salle
 * hors service (relogement dans une salle équivalente, même campus d'abord), journée à annuler
 * (fête lunaire confirmée ou décalée). Les modifications passent par enregistrerSeance : mêmes
 * règles, historique et notifications que le reste.
 */

const INCLUDES_SEANCE = [
    { model: Creneau, as: "creneau" },
    { model: Salle, as: "salle" },
    { model: Cours, as: "cours", attributes: ["id_cours", "code_cours", "nom_cours"] },
    { model: Groupe, as: "groupe", attributes: ["id_groupe", "nom_groupe", "effectif", "id_filiere"] },
    { model: Users, as: "enseignant", attributes: ["id_user", "nom", "prenom"] },
];
const nomComplet = (u) => (u ? `${u.prenom ?? ""} ${u.nom ?? ""}`.trim() : "");

/**
 * Remplaçants possibles pour une séance : enseignants compétents sur le module (sinon tous),
 * libres à ce moment et disponibles (opt-in pour les vacataires), le moins chargé ce jour-là d'abord.
 */
export const remplacantsPossibles = async (seance, { limite = 5 } = {}) => {
    const occupations = await occupationsDuJour(seance.date_seance, { exclure: { seance: seance.id_affectation } });
    const pris = new Set(occupations.filter((o) => seChevauchent(seance.creneau, o)).flatMap((o) => o.personnes));
    const chargeJour = new Map();
    occupations.forEach((o) => o.personnes.forEach((id) => chargeJour.set(id, (chargeJour.get(id) || 0) + 1)));

    const competents = new Set((await CompetenceEnseignant.findAll({ where: { id_cours: seance.id_cours }, attributes: ["id_user"] })).map((c) => c.id_user));
    const enseignants = await Enseignant.findAll({ include: [{ model: Users, as: "user", where: { actif: true }, attributes: ["id_user", "nom", "prenom"] }] });
    const candidats = [];
    for (const e of enseignants.filter((x) => x.id_user !== seance.id_user_enseignant && !pris.has(x.id_user))) {
        const dispo = await disponibiliteEnseignant({ idUser: e.id_user, date: seance.date_seance, idCreneau: seance.id_creneau });
        if (!dispo.disponible) continue;
        candidats.push({ id_user: e.id_user, nom: e.user.nom, prenom: e.user.prenom, statut: e.statut, departement: e.departement, competent: competents.has(e.id_user), seances_ce_jour: chargeJour.get(e.id_user) || 0 });
    }
    return candidats
        .sort((a, b) => Number(b.competent) - Number(a.competent) || a.seances_ce_jour - b.seances_ce_jour || a.nom.localeCompare(b.nom))
        .slice(0, limite);
};

/**
 * Absence d'un enseignant sur une période : enregistrée comme indisponibilité sur tous les
 * créneaux (elle bloque donc toute nouvelle séance), et ses séances concernées sont listées
 * avec des remplaçants possibles.
 */
export const declarerAbsence = async ({ id_user, date_debut, date_fin, motif, user }) => {
    if (user.role !== "admin" && user.id_user !== Number(id_user)) throw new ErreurMetier("Vous ne pouvez déclarer que votre propre absence", 403);
    if (date_fin < date_debut) throw new ErreurMetier("La date de fin précède la date de début", 400);
    const enseignant = await Enseignant.findByPk(id_user, { include: [{ model: Users, as: "user" }] });
    if (!enseignant) throw new ErreurMetier("Enseignant introuvable", 404);

    const creneaux = await Creneau.findAll({ attributes: ["id_creneau"] });
    await sequelize.transaction(async (transaction) => {
        await Disponibilite.bulkCreate(
            creneaux.map((c) => ({ id_user_enseignant: Number(id_user), id_creneau: c.id_creneau, date_debut, date_fin, disponible: false, raison_indisponibilite: `Absence : ${motif}` })),
            { transaction }
        );
    });

    const seances = await Affectation.findAll({
        where: { id_user_enseignant: id_user, statut: STATUTS_ACTIFS, date_seance: { [Op.between]: [date_debut, date_fin] } },
        include: INCLUDES_SEANCE,
        order: [["date_seance", "ASC"]],
    });
    const touchees = [];
    for (const s of seances) touchees.push({ seance: s, remplacants: await remplacantsPossibles(s) });

    if (user.role !== "admin" && touchees.length) {
        await notifierAdministrateurs({
            titre: "Absence d'enseignant",
            message: `${nomComplet(enseignant.user)} sera absent du ${date_debut} au ${date_fin} (${motif}) : ${touchees.length} séance(s) à traiter.`,
            type_notification: "warning",
            lien: "/gestion/imprevus",
        }).catch(() => {});
    }
    return { absence: { id_user: Number(id_user), date_debut, date_fin, motif }, seances: touchees };
};

/** Confie une séance à un autre enseignant (validé par les règles, comme toute modification). */
export const remplacerEnseignant = async ({ id, id_user, user, forcer, justification }) => {
    const avant = await Affectation.findByPk(id, { include: INCLUDES_SEANCE });
    if (!avant) throw new ErreurMetier("Affectation non trouvée", 404);
    const resultat = await enregistrerSeance({ id, donnees: { id_user_enseignant: Number(id_user) }, user, forcer, justification });
    const remplacant = await Users.findByPk(id_user, { attributes: ["id_user", "nom", "prenom"] });
    const quand = `${avant.date_seance} à ${String(avant.creneau.heure_debut).slice(0, 5)}`;
    await notifierChangementSeance({
        affectation: { ...resultat.affectation.get({ plain: true }) },
        titre: "Séance confiée à un remplaçant",
        message: `${avant.cours?.nom_cours ?? "Une séance"} du ${quand} est assurée par ${nomComplet(remplacant)}.`,
    });
    return resultat;
};

/**
 * Salle hors service sur une période : chaque séance concernée est proposée dans une salle
 * équivalente libre (même type, assez grande, même campus d'abord). Avec `appliquer`, les
 * séances sont déplacées ; celles sans solution sont renvoyées pour traitement à la main.
 */
export const relogerSeances = async ({ id_salle, date_debut, date_fin, appliquer = false, user }) => {
    const salle = await Salle.findByPk(id_salle);
    if (!salle) throw new ErreurMetier("Salle introuvable", 404);
    const seances = await Affectation.findAll({
        where: { id_salle, statut: STATUTS_ACTIFS, date_seance: { [Op.between]: [date_debut, date_fin] } },
        include: INCLUDES_SEANCE,
        order: [["date_seance", "ASC"]],
    });
    const equivalentes = (await Salle.findAll({ where: { disponible: true, type_salle: salle.type_salle, id_salle: { [Op.ne]: salle.id_salle } } })).sort(
        (a, b) => Number(b.id_campus === salle.id_campus) - Number(a.id_campus === salle.id_campus) || a.capacite - b.capacite
    );

    const resultats = [];
    for (const seance of seances) {
        let choisie = null;
        for (const candidate of equivalentes.filter((s) => s.capacite >= (seance.groupe?.effectif || 0))) {
            const { violations } = await validerAffectation({ ...seance.get({ plain: true }), id_salle: candidate.id_salle });
            if (!violations.some((v) => v.bloquant)) {
                choisie = candidate;
                break;
            }
        }
        const ligne = { seance, salle_proposee: choisie ? { id_salle: choisie.id_salle, nom_salle: choisie.nom_salle, id_campus: choisie.id_campus } : null, deplacee: false };
        if (choisie && appliquer) {
            await enregistrerSeance({ id: seance.id_affectation, donnees: { id_salle: choisie.id_salle }, user });
            await notifierChangementSeance({
                affectation: seance,
                titre: "Changement de salle",
                message: `${seance.cours?.nom_cours ?? "Une séance"} du ${seance.date_seance} à ${String(seance.creneau.heure_debut).slice(0, 5)} a lieu en ${choisie.nom_salle} (${salle.nom_salle} indisponible).`,
            });
            ligne.deplacee = true;
        }
        resultats.push(ligne);
    }
    return {
        salle: { id_salle: salle.id_salle, nom_salle: salle.nom_salle },
        seances: resultats,
        sans_solution: resultats.filter((r) => !r.salle_proposee).length,
    };
};

/** Séances actives d'une journée (fête lunaire confirmée ou décalée), facultativement d'une filière. */
export const seancesDuJour = async ({ date, id_filiere = null }) =>
    Affectation.findAll({
        where: { date_seance: date, statut: STATUTS_ACTIFS },
        include: INCLUDES_SEANCE.map((inc) =>
            inc.as === "groupe" && id_filiere ? { ...inc, where: { id_filiere: Number(id_filiere) }, include: [{ model: Filiere, as: "filiere", attributes: ["code_filiere"] }] } : inc
        ),
        order: [[{ model: Creneau, as: "creneau" }, "heure_debut", "ASC"]],
    });

/**
 * Annule toutes les séances d'une journée (férié confirmé, décalage d'une fête lunaire) ;
 * chaque séance annulée est notifiée et reste à rattraper (assistant de créneaux).
 */
export const annulerJournee = async ({ date, motif, id_filiere = null, user }) => {
    if (!String(motif || "").trim()) throw new ErreurMetier("Indiquez le motif de l'annulation", 400);
    const seances = await seancesDuJour({ date, id_filiere });
    const annulees = [];
    for (const seance of seances) {
        await enregistrerSeance({ id: seance.id_affectation, donnees: { statut: "annule", commentaire: `Annulée : ${motif.trim()}` }, user });
        await notifierChangementSeance({
            affectation: seance,
            titre: "Séance annulée",
            message: `${seance.cours?.nom_cours ?? "Une séance"} du ${date} est annulée (${motif.trim()}). Un rattrapage sera proposé.`,
        });
        annulees.push(seance.id_affectation);
    }
    return { date, annulees };
};
