import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { planification } from "../utils/erreursPlanning.js";
import { abonnementDe, fluxIcs, renouvelerAbonnement } from "../services/calendrier/ics.js";
import { etatEnvois, publierEdtDuMois } from "../services/calendrier/envoiEdt.js";

/**
 * Agenda personnel et envoi de l'emploi du temps (phase R4) :
 *  - GET  /api/agenda/abonnement                mon adresse d'abonnement ICS { chemin, cree_le }
 *  - POST /api/agenda/abonnement/renouveler     nouvelle adresse (l'ancienne cesse de marcher)
 *  - GET  /api/agenda/<jeton>.ics               flux ICS, sans connexion : l'adresse secrète suffit
 *  - POST /api/agenda/edt-mensuel/publier       { mois, id_filiere } : publier et envoyer le mois aux classes
 *  - GET  /api/agenda/edt-mensuel/etat          ?mois=&id_filiere= : publié ? dernier envoi, destinataires
 */
const router = express.Router();

router.get("/abonnement", authenticateToken, planification(async (req, res) => {
    res.json(await abonnementDe(req.user));
}));

router.post("/abonnement/renouveler", authenticateToken, planification(async (req, res) => {
    res.json(await renouvelerAbonnement(req.user));
}));

router.post("/edt-mensuel/publier", authenticateToken, planification(async (req, res) => {
    res.json(await publierEdtDuMois(req.user, req.body ?? {}));
}));

router.get("/edt-mensuel/etat", authenticateToken, planification(async (req, res) => {
    res.json(await etatEnvois(req.user, { mois: req.query.mois, id_filiere: req.query.id_filiere }));
}));

// Flux de l'agenda : lu par Google Agenda, Outlook ou le téléphone, sans cookie ni jeton d'accès
router.get("/:fichier", async (req, res, next) => {
    try {
        const jeton = /^(.+)\.ics$/.exec(req.params.fichier)?.[1];
        const ics = jeton ? await fluxIcs(jeton) : null;
        if (!ics) return res.status(404).type("text/plain").send("Calendrier introuvable");
        res.set({
            "Content-Type": "text/calendar; charset=utf-8",
            "Content-Disposition": 'inline; filename="hestim.ics"',
            "Cache-Control": "private, max-age=900",
        });
        return res.send(ics);
    } catch (error) {
        return next(error);
    }
});

export default router;
