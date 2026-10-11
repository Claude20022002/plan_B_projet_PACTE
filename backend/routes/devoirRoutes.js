import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { planification } from "../utils/erreursPlanning.js";
import {
    creerDevoir,
    devoirsDe,
    quizDisponibles,
    rendreDevoir,
    resultatsDuDevoir,
    sujetDuDevoir,
    supprimerDevoir,
} from "../services/quiz/devoirs.js";
import { exigerDevoirsActifs } from "../services/quiz/devoirsActifs.js";

/**
 * Devoirs notés : un quiz ClassQuiz corrigé par Planner (phase Q). Les devoirs « fichier » ont été
 * retirés le 10 octobre 2026 (l'enseignant ne donne que des quiz).
 *  - GET    /api/devoirs/quiz-disponibles  mes quiz ClassQuiz (enseignant)
 *  - GET    /api/devoirs                   mes devoirs (étudiant) ou ceux que j'ai donnés (enseignant)
 *  - POST   /api/devoirs                   { quiz_id, id_cours, id_groupe?, date_limite }
 *  - GET    /api/devoirs/:id               sujet (sans réponses), correction après la date limite
 *  - POST   /api/devoirs/:id/rendu         { reponses } : une copie, notée sur 20
 *  - GET    /api/devoirs/:id/resultats     notes des étudiants visés (enseignant)
 *  - DELETE /api/devoirs/:id               supprimer le devoir
 * Devoirs fermés (DEVOIRS_ACTIFS éteinte, lot D-2) : toutes répondent 503, sauf la première.
 */
const router = express.Router();
router.use(authenticateToken);

// Déclarée avant la garde : la liste des quiz de l'enseignant sert aussi à lancer une partie en
// direct (POST /api/quiz/parties), qui reste ouverte quand les devoirs sont fermés
router.get("/quiz-disponibles", planification(async (req, res) => {
    res.json({ data: await quizDisponibles(req.user) });
}));

router.use(exigerDevoirsActifs);

router.get("/", planification(async (req, res) => {
    res.json({ data: await devoirsDe(req.user) });
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
