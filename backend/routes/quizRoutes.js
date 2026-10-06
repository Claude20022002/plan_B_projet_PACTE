import express from "express";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { enregistrerFinPartie, enregistrerPartie, historiqueQuiz, partiesEnCours, resultatsPartie, signatureValide, urlQuiz, webhookActif } from "../services/quiz/parties.js";

/**
 * Jeux pédagogiques (phase Q).
 *  - POST /api/quiz/webhook : appelé par le fork de ClassQuiz quand une partie démarre
 *    (game.started) et quand elle se termine (game.finished, scores) ; corps brut signé (HMAC),
 *    monté avant les lecteurs JSON et hors CSRF (pas de cookie).
 *  - GET /api/quiz/config : le web sait s'il doit proposer « Lancer un quiz » et où.
 *  - GET /api/quiz/parties/en-cours : parties à rejoindre (étudiant) ou lancées (enseignant).
 *  - GET /api/quiz/parties/historique : dernières parties terminées (enseignant) ou mes scores.
 *  - GET /api/quiz/parties/:id/resultats : classement, équipes (groupes de TP), nuages de mots.
 */

export const webhookQuiz = express.Router();

webhookQuiz.post("/", express.raw({ type: "application/json", limit: "32kb" }), asyncHandler(async (req, res) => {
    if (!webhookActif()) return res.status(503).json({ message: "Webhook ClassQuiz désactivé" });
    const corps = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    if (!signatureValide(corps, req.get("X-Hestim-Timestamp"), req.get("X-Hestim-Signature"))) {
        return res.status(401).json({ message: "Signature invalide" });
    }
    let evenement;
    try {
        evenement = JSON.parse(corps.toString("utf8"));
    } catch {
        return res.status(400).json({ message: "Corps JSON invalide" });
    }
    if (evenement?.event === "game.finished" && evenement.game_id) {
        const fin = await enregistrerFinPartie(evenement);
        // Partie inconnue de Planner (lancée hors plateforme) : acceptée sans suite
        if (!fin) return res.status(202).json({ rattachee: false });
        return res.status(fin.deja ? 200 : 201).json({ id: fin.partie.id_quiz_partie, resultats: fin.resultats });
    }
    if (evenement?.event !== "game.started" || !evenement.game_id || !/^\d{4,12}$/.test(String(evenement.game_pin ?? ""))) {
        return res.status(400).json({ message: "Événement inattendu" });
    }
    const resultat = await enregistrerPartie(evenement);
    // Partie d'un compte inconnu de Planner : acceptée sans suite (le fork n'a pas à réessayer)
    if (!resultat) return res.status(202).json({ rattachee: false });
    res.status(201).json({ id: resultat.partie.id_quiz_partie, seance: resultat.partie.id_affectation, notifies: resultat.notifies });
}));

const router = express.Router();

router.get("/config", authenticateToken, (req, res) => {
    const url = urlQuiz();
    res.json({ actif: Boolean(url), url, peutLancer: Boolean(url) && req.user.role === "enseignant" });
});

router.get("/parties/en-cours", authenticateToken, asyncHandler(async (req, res) => {
    res.json({ data: await partiesEnCours(req.user) });
}));

router.get("/parties/historique", authenticateToken, asyncHandler(async (req, res) => {
    res.json({ data: await historiqueQuiz(req.user) });
}));

router.get("/parties/:id/resultats", authenticateToken, asyncHandler(async (req, res) => {
    const resultats = await resultatsPartie(req.user, req.params.id);
    if (!resultats) return res.status(404).json({ message: "Partie introuvable" });
    res.json(resultats);
}));

export default router;
