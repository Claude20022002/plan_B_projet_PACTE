import express from "express";
import {
    activerSnapshot,
    arreterSession,
    genererAffectations,
    getSession,
    listerSessions,
    getSnapshot,
    listerSnapshots,
    rollbackSnapshot,
} from "../controllers/generationAutomatiqueController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Toutes les routes nécessitent une authentification et le rôle admin
router.use(authenticateToken);
router.use(requireRole("admin"));

/**
 * POST /api/generation-automatique/generer
 * Lance la génération Timefold d'une période : { id_periode, id_filieres?, duree_secondes? }
 */
router.post("/generer", genererAffectations);

// Suivi d'une génération (avancement, rapport) et arrêt anticipé
router.get("/sessions", listerSessions);
router.get("/sessions/:id", getSession);
router.post("/sessions/:id/arreter", arreterSession);

router.get("/snapshots", listerSnapshots);
router.get("/snapshots/:id", getSnapshot);
router.post("/snapshots/:id/activate", activerSnapshot);
router.post("/snapshots/:id/rollback", rollbackSnapshot);

export default router;
