import express from "express";
import { genererAffectations } from "../controllers/generationAutomatiqueController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Toutes les routes nécessitent une authentification et le rôle admin
router.use(authenticateToken);
router.use(requireRole("admin"));

/**
 * POST /api/generation-automatique/generer
 * Génère automatiquement les affectations pour un semestre
 */
router.post("/generer", genererAffectations);

export default router;
