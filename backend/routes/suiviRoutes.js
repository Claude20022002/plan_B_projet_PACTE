import express from "express";
import {
    getEnseignants,
    getExportVacataires,
    getModules,
    postActualiser,
} from "../controllers/suiviController.js";
import { authenticateToken, requireAdmin } from "../middleware/index.js";
import { requireAdminOuResponsable } from "../services/planning/droits.js";

const router = express.Router();

router.use(authenticateToken);

// ✅ Séances passées marquées réalisées d'office (aussi fait par une tâche périodique)
router.post("/actualiser", requireAdmin, postActualiser);

// 📈 Avancement des modules (administration, responsables pour leurs filières), heures des enseignants
router.get("/modules", requireAdminOuResponsable, getModules);
router.get("/enseignants", requireAdmin, getEnseignants);
router.get("/vacataires.csv", requireAdmin, getExportVacataires);

export default router;
