import { DemandeReport } from "../models/index.js";
import { reporterPlusTard, reprogrammer } from "../services/planning/reportPlusTard.js";
import { planification } from "../utils/erreursPlanning.js";
import { repondreErreur } from "../utils/erreurs.js";
import { demandeComplete, repondreSansCreneau } from "./reportCommun.js";

/**
 * Report « à une date ultérieure » (lot R-1), côté administration :
 *  - PATCH /api/demandes-report/:id/plus-tard   accepter sans date (la séance passe « à reprogrammer ») ;
 *  - PATCH /api/demandes-report/:id/reprogrammer { date, id_creneau?, id_salle?, forcer?, justification? }
 *    fixer la date ; la demande passe « à confirmer » et l'enseignant la confirme (PATCH /:id/confirmer).
 * Les séances à reprogrammer se lisent par GET /api/demandes-report/statut/a_reprogrammer ; les
 * créneaux libres d'une date, par GET /api/demandes-report/:id/propositions?date=.
 */

const charger = async (req, res) => {
    const demande = await DemandeReport.findByPk(req.params.id);
    if (!demande) repondreErreur(res, 404, "Demande de report non trouvée");
    return demande;
};

export const accepterPlusTard = planification(async (req, res) => {
    const demande = await charger(req, res);
    if (!demande) return;
    await reporterPlusTard(demande, req.user);
    res.json({ message: "Report accepté : la séance est à reprogrammer", demande: await demandeComplete(demande.id_demande) });
});

export const fixerDate = planification(async (req, res) => {
    const demande = await charger(req, res);
    if (!demande) return;
    const { sansPlace } = await reprogrammer(demande, req.user, { ...req.body, forcer: req.body?.forcer === true });
    if (sansPlace) return repondreSansCreneau(res, sansPlace.date, sansPlace);
    res.json({ message: "Nouvelle date proposée : l'enseignant doit la confirmer", demande: await demandeComplete(demande.id_demande) });
});
