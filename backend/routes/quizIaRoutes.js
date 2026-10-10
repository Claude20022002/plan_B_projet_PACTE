import express from "express";
import { authenticateToken, requireRole } from "../middleware/index.js";
import { createRateLimiter } from "../middleware/rateLimiterMiddleware.js";
import { planification } from "../utils/erreursPlanning.js";
import { contexteDe } from "../services/journalSecurite.js";
import { TAILLE_MAX, TYPES_SUPPORTS } from "../services/ia/extraction.js";
import { creerDansClassQuiz, disponibilite, etatGeneration, lancerGeneration, mesGenerations, modifierBrouillon, regenererQuestion } from "../services/ia/quiz.js";

/**
 * Quiz générés par l'IA (enseignants) — docs/plans/quiz-ia.md
 *  - GET    /api/quiz-ia/disponibilite                       service configuré, générations restantes
 *  - POST   /api/quiz-ia/generations?id_cours=&id_groupe=&plage=&nombre=&type=&difficulte=&langue=&temps=&nom=
 *                                                            corps : le support (PDF, DOCX, PPTX) → { id_generation, statut }
 *  - GET    /api/quiz-ia/generations                         mes 20 dernières générations
 *  - GET    /api/quiz-ia/generations/:id                     état et brouillon
 *  - PUT    /api/quiz-ia/generations/:id/questions           brouillon relu { questions }
 *  - POST   /api/quiz-ia/generations/:id/questions/:index/regenerer
 *  - POST   /api/quiz-ia/generations/:id/creer               { titre? } : crée le quiz relu dans ClassQuiz → statut « cree »
 */
const router = express.Router();
router.use(authenticateToken, requireRole("enseignant"));

// Appels au fournisseur (génération, régénération) : en plus du quota par 24 heures, au plus
// 30 par quart d'heure et par enseignant (compteurs gardés en base)
const limiteIa = createRateLimiter({
    nom: "quiz-ia",
    persistant: true,
    windowMs: 15 * 60 * 1000,
    max: 30,
    keyGenerator: (req) => (req.user ? `enseignant:${req.user.id_user}` : null),
    message: "Trop de demandes à l'IA : réessayez dans quelques minutes.",
});

// Corps brut limité à la taille d'un support (+ marge) ; au-delà, 413 avant toute lecture
const corpsBrut = express.raw({ type: TYPES_SUPPORTS, limit: TAILLE_MAX + 1024 });
const lireSupport = (req, res, next) =>
    corpsBrut(req, res, (err) => (err ? res.status(err.status === 413 ? 413 : 400).json({ message: err.status === 413 ? `Support : ${TAILLE_MAX / 1024 / 1024} Mo au plus` : "Fichier illisible" }) : next()));

router.get("/disponibilite", planification(async (req, res) => res.json(await disponibilite(req.user))));

router.post(
    "/generations",
    limiteIa,
    lireSupport,
    planification(async (req, res) => {
        const { id_cours, id_groupe, plage, nombre, type, difficulte, langue, temps, nom } = req.query;
        const reglages = {
            ...(nombre !== undefined ? { nombre: Number(nombre) } : {}),
            ...(type !== undefined ? { type } : {}),
            ...(difficulte !== undefined ? { difficulte } : {}),
            ...(langue !== undefined ? { langue } : {}),
            ...(temps !== undefined ? { temps: Number(temps) } : {}),
        };
        const fichier = { contenu: Buffer.isBuffer(req.body) ? req.body : null, type: req.get("Content-Type"), nom };
        res.status(202).json(await lancerGeneration(req.user, { id_cours, id_groupe, plage, reglages, fichier }, contexteDe(req)));
    })
);

router.get("/generations", planification(async (req, res) => res.json(await mesGenerations(req.user))));
router.get("/generations/:id", planification(async (req, res) => res.json(await etatGeneration(req.user, req.params.id))));
router.put("/generations/:id/questions", planification(async (req, res) => res.json(await modifierBrouillon(req.user, req.params.id, req.body?.questions))));
router.post("/generations/:id/creer", planification(async (req, res) => res.status(201).json(await creerDansClassQuiz(req.user, req.params.id, { titre: req.body?.titre }))));
router.post("/generations/:id/questions/:index/regenerer", limiteIa, planification(async (req, res) => res.json(await regenererQuestion(req.user, req.params.id, req.params.index))));

export default router;
