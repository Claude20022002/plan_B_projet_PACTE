import { Affectation, DemandeReport } from "../models/index.js";
import { propositionsDeReport, retenirProposition } from "../services/planning/reports.js";
import { appliquerReport } from "../services/planning/reportDecision.js";
import { ViolationsBloquantes } from "../services/planning/seances.js";
import { planification } from "../utils/erreursPlanning.js";
import { repondreErreur } from "../utils/erreurs.js";
import { demandeComplete, repondreSansCreneau } from "./reportCommun.js";

/**
 * Réponse de l'enseignant à un report validé par l'administration (décision du 21 octobre 2026) :
 * « accepter » la place proposée, ou « proposer » un autre créneau (date et créneau) que le serveur
 * vérifie sur l'emploi du temps des étudiants, de l'enseignant et la disponibilité des salles.
 * Dans les deux cas, si la place tient, le report est validé et les étudiants sont prévenus.
 */

const ACTIONS = ["accepter", "proposer"];

// ✅ PATCH /api/demandes-report/:id/confirmer — { action: "accepter" } ou { action: "proposer", nouvelle_date, id_creneau }
export const confirmerReport = planification(async (req, res) => {
    const { action } = req.body;
    if (!ACTIONS.includes(action)) {
        return repondreErreur(res, 400, "Action invalide : « accepter » ou « proposer ».");
    }
    const demande = await DemandeReport.findByPk(req.params.id);
    if (!demande || (req.user.role !== "admin" && demande.id_user_enseignant !== req.user.id_user)) {
        return repondreErreur(res, 404, "Demande de report non trouvée");
    }
    if (demande.statut_demande !== "a_confirmer") {
        return repondreErreur(res, 400, "Ce report n'attend pas votre confirmation.", { code: "PAS_A_CONFIRMER" });
    }
    const affectation = await Affectation.findByPk(demande.id_affectation);

    if (action === "accepter") {
        const place = { date: demande.nouvelle_date, id_creneau: demande.id_creneau_nouveau, id_salle: demande.id_salle_nouvelle };
        try {
            await appliquerReport({ demande, place, user: req.user });
        } catch (error) {
            if (!(error instanceof ViolationsBloquantes)) throw error;
            // La place a été prise depuis la validation : la demande reste à confirmer, avec ce qui est encore libre
            const resultat = await propositionsDeReport({ affectation, date: demande.nouvelle_date });
            return repondreErreur(res, 409, "Ce créneau n'est plus libre : proposez-en un autre.", {
                code: "CRENEAU_PLUS_LIBRE",
                violations: error.violations,
                donnees: { propositions: resultat.propositions, dates_proches: resultat.dates_proches },
            });
        }
    } else {
        if (!req.body.nouvelle_date || !req.body.id_creneau) {
            return repondreErreur(res, 400, "Indiquez la date et le créneau que vous proposez.");
        }
        // Le créneau proposé doit être libre pour l'enseignant, le groupe et ses sous-groupes, avec une salle à la bonne capacité
        const resultat = await propositionsDeReport({ affectation, date: req.body.nouvelle_date });
        const retenue = retenirProposition(resultat, req.body.id_creneau);
        if (!retenue) return repondreSansCreneau(res, resultat.date, resultat);
        await appliquerReport({ demande, place: { date: resultat.date, id_creneau: retenue.id_creneau, id_salle: retenue.id_salle }, user: req.user, parEnseignant: true });
    }

    res.json({ message: "Report validé : les étudiants sont prévenus", demande: await demandeComplete(demande.id_demande) });
});
