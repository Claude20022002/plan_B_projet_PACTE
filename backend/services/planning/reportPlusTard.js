import { Affectation, Cours } from "../../models/index.js";
import { creerNotification } from "../../utils/notificationHelper.js";
import { enregistrerSeance, notifierChangementSeance } from "./seances.js";
import { dateISO, dateLisible, propositionsDeReport, retenirProposition } from "./reports.js";
import { notifierPropositionAConfirmer, verifierPlace } from "./reportDecision.js";
import { ErreurMetier } from "./enseignements.js";

/**
 * Report « à une date ultérieure » (retours du 21 octobre 2026, lot R-1) : l'administration accepte la
 * demande sans fixer de date. La séance passe « à reprogrammer » : elle quitte l'emploi du temps et
 * libère sa salle ; l'enseignant et les étudiants sont prévenus (« la nouvelle date vous sera
 * communiquée »). Plus tard, l'administration fixe la date : la demande passe « à confirmer » et suit le
 * circuit de tout report (l'enseignant accepte ou propose un autre créneau, reportDecision.js) ; les
 * étudiants sont prévenus une seconde fois, quand la nouvelle date est confirmée.
 */

const chargerSeance = async (demande) => {
    const affectation = await Affectation.findByPk(demande.id_affectation, { include: [{ model: Cours, as: "cours" }] });
    if (!affectation) throw new ErreurMetier("Séance introuvable", 404);
    return affectation;
};

/** Accepte une demande en attente sans date : la séance passe « à reprogrammer ». */
export const reporterPlusTard = async (demande, user) => {
    if (demande.statut_demande !== "en_attente") throw new ErreurMetier("Cette demande n'attend plus de décision de l'administration", 400);
    const affectation = await chargerSeance(demande);
    await enregistrerSeance({
        id: affectation.id_affectation,
        donnees: {
            statut: "a_reprogrammer",
            // Date et heure de départ gardées : la séance les affiche « reportée · date à venir »
            date_seance_initiale: affectation.date_seance_initiale ?? affectation.date_seance,
            id_creneau_initial: affectation.id_creneau_initial ?? affectation.id_creneau,
        },
        user,
        action: "report",
    });
    await demande.update({ statut_demande: "a_reprogrammer", id_user_decision: user.id_user, justification_forcage: null });

    const coursNom = affectation.cours?.nom_cours || "Votre cours";
    const quand = dateLisible(affectation.date_seance);
    try {
        await creerNotification({
            id_user: demande.id_user_enseignant,
            titre: "Report accepté, date à venir",
            message: `« ${coursNom} » du ${quand} est reporté. L'administration fixera la nouvelle date ; vous pourrez la confirmer.`,
            type_notification: "info",
            lien: `/demandes-report?demande=${demande.id_demande}`,
        });
    } catch (error) {
        console.error("Notification de l'enseignant impossible :", error.message);
    }
    await notifierChangementSeance({
        affectation,
        notifierEnseignant: false,
        titre: "Séance reportée",
        message: `« ${coursNom} » du ${quand} est reportée à une date ultérieure : la nouvelle date vous sera communiquée.`,
    });
    return demande;
};

/**
 * L'administration fixe la date d'une séance à reprogrammer. Sans `id_creneau`, le meilleur créneau
 * libre de la date ; avec, ce créneau s'il est libre (salle choisie par le serveur, ou `id_salle`).
 * Rend { demande } ou { sansPlace: résultat des propositions } s'il n'y a pas de place ce jour-là.
 */
export const reprogrammer = async (demande, user, { date, id_creneau: idCreneau = null, id_salle: idSalle = undefined, forcer = false, justification = null } = {}) => {
    if (demande.statut_demande !== "a_reprogrammer") throw new ErreurMetier("Cette séance n'est pas à reprogrammer", 400);
    if (!date) throw new ErreurMetier("Indiquez la nouvelle date", 400);
    const affectation = await chargerSeance(demande);

    let place;
    if (idCreneau && idSalle !== undefined) {
        place = { date: dateISO(date), id_creneau: Number(idCreneau), id_salle: idSalle === null ? null : Number(idSalle) };
    } else {
        const resultat = await propositionsDeReport({ affectation, date });
        const retenue = retenirProposition(resultat, idCreneau);
        if (!retenue) return { sansPlace: resultat };
        place = { date: resultat.date, id_creneau: retenue.id_creneau, id_salle: retenue.id_salle };
    }
    // Les mêmes règles qu'une séance saisie ; un forçage justifié s'appliquera à la confirmation
    await verifierPlace(affectation, place, { forcer, justification });
    await demande.update({
        statut_demande: "a_confirmer",
        nouvelle_date: place.date,
        id_creneau_nouveau: place.id_creneau,
        id_salle_nouvelle: place.id_salle ?? null,
        id_user_decision: user.id_user,
        justification_forcage: forcer ? String(justification).trim() : null,
    });
    await notifierPropositionAConfirmer(demande, affectation);
    return { demande };
};
