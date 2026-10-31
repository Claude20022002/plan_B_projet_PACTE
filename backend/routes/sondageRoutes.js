import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { planification } from "../utils/erreursPlanning.js";
import { clore, creerSondage, lireSondages, repondre, supprimer } from "../services/cours/sondages.js";

/**
 * Sondages de l'enseignant à sa classe (plan multi-établissements, lot EC-9 ;
 * conception-ec9-groupe-b.md, contrat d'API). Une classe est désignée par son module et son groupe,
 * comme dans l'espace de cours ; les droits et les règles sont dans services/cours/sondages.js.
 */
const router = express.Router();

router.get("/classes/:idCours/:idGroupe/sondages", authenticateToken, planification(async (req, res) => {
    res.json(await lireSondages(req.user, req.params.idCours, req.params.idGroupe));
}));
router.post("/classes/:idCours/:idGroupe/sondages", authenticateToken, planification(async (req, res) => {
    res.status(201).json(await creerSondage(req.user, req.params.idCours, req.params.idGroupe, req.body));
}));
router.post("/sondages/:id/reponse", authenticateToken, planification(async (req, res) => {
    await repondre(req.user, req.params.id, req.body?.id_choix);
    res.status(204).end();
}));
router.post("/sondages/:id/cloture", authenticateToken, planification(async (req, res) => {
    res.json(await clore(req.user, req.params.id));
}));
router.delete("/sondages/:id", authenticateToken, planification(async (req, res) => {
    await supprimer(req.user, req.params.id);
    res.status(204).end();
}));

export default router;
