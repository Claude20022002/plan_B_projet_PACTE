import express from "express";
import { authenticateToken, requireAdmin, asyncHandler } from "../middleware/index.js";
import { EVENEMENTS, lireJournal } from "../services/journalSecurite.js";

const router = express.Router();

// Journal de sécurité : consultation seule, réservée à l'administration
router.use(authenticateToken, requireAdmin);

// GET /api/journal-securite?id_user=&evenement=&du=AAAA-MM-JJ&au=AAAA-MM-JJ&page=&par_page= (100 au plus)
router.get("/", asyncHandler(async (req, res) => res.json(await lireJournal(req.query))));

// Types d'événements (filtre de l'écran)
router.get("/evenements", (req, res) => res.json(EVENEMENTS));

export default router;
