import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { planification } from "../utils/erreursPlanning.js";
import { creerDevoir, devoirsDe, quizDisponibles, rendreDevoir, resultatsDuDevoir, sujetDuDevoir, supprimerDevoir } from "../services/quiz/devoirs.js";

/**
 * Devoirs notés (phase Q) : un quiz ClassQuiz donné en devoir dans un module, corrigé par Planner.
 *  - GET    /api/devoirs                   mes devoirs (étudiant) ou ceux que j'ai donnés (enseignant)
 *  - GET    /api/devoirs/quiz-disponibles  mes quiz ClassQuiz (enseignant)
 *  - POST   /api/devoirs                   { quiz_id, id_cours, id_groupe?, date_limite }
 *  - GET    /api/devoirs/:id               sujet (sans réponses), correction après la date limite
 *  - POST   /api/devoirs/:id/rendu         { reponses } : une copie, notée sur 20
 *  - GET    /api/devoirs/:id/resultats     notes des étudiants visés (enseignant)
 *  - DELETE /api/devoirs/:id               supprimer le devoir
 */
const router = express.Router();
router.use(authenticateToken);

router.get("/", planification(async (req, res) => {
    res.json({ data: await devoirsDe(req.user) });
}));

router.get("/quiz-disponibles", planification(async (req, res) => {
    res.json({ data: await quizDisponibles(req.user) });
}));

router.post("/", planification(async (req, res) => {
    res.status(201).json(await creerDevoir(req.user, req.body ?? {}));
}));

router.get("/:id", planification(async (req, res) => {
    res.json(await sujetDuDevoir(req.user, req.params.id));
}));

router.post("/:id/rendu", planification(async (req, res) => {
    res.status(201).json(await rendreDevoir(req.user, req.params.id, req.body?.reponses));
}));

router.get("/:id/resultats", planification(async (req, res) => {
    res.json(await resultatsDuDevoir(req.user, req.params.id));
}));

router.delete("/:id", planification(async (req, res) => {
    res.json(await supprimerDevoir(req.user, req.params.id));
}));

export default router;
