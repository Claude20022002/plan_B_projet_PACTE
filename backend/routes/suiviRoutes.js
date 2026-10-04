import express from "express";
import {
    getEnseignants,
    getExportVacataires,
    getMesRetours,
    getModules,
    getRetoursADonner,
    getRetoursEnseignant,
    patchRealiser,
    postActualiser,
    postRetour,
} from "../controllers/suiviController.js";
import { authenticateToken, requireAdmin, requireEnseignant, requireRole } from "../middleware/index.js";
import { requireAdminOuResponsable } from "../services/planning/droits.js";

const router = express.Router();

router.use(authenticateToken);

// ✅ Séance faite : son enseignant (ou l'administration)
router.patch("/seances/:id/realiser", requireEnseignant, patchRealiser);
router.post("/actualiser", requireAdmin, postActualiser);

// 📈 Avancement des modules (administration, responsables pour leurs filières), heures des enseignants
router.get("/modules", requireAdminOuResponsable, getModules);
router.get("/enseignants", requireAdmin, getEnseignants);
router.get("/vacataires.csv", requireAdmin, getExportVacataires);

// 💬 Retours de séance (I7) : l'étudiant répond, l'enseignant voit une tendance anonyme
router.get("/retours/a-donner", requireRole("etudiant"), getRetoursADonner);
router.post("/retours/seances/:id", requireRole("etudiant"), postRetour);
router.get("/retours/mes-modules", requireRole("enseignant"), getMesRetours);
router.get("/retours/enseignants/:id", requireAdmin, getRetoursEnseignant);

export default router;
