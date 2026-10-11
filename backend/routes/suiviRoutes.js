import express from "express";
import {
    getEnseignants,
    getExportVacataires,
    getModules,
    getSeancesAVerifier,
    postActualiser,
    putVisa,
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

// 🔎 Séances sans appel validé : l'administration les confirme ou les écarte avant l'export (R-11)
router.get("/seances-a-verifier", requireAdmin, getSeancesAVerifier);
router.put("/seances/:id/visa", requireAdmin, putVisa);

export default router;
