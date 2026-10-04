import express from "express";
import {
    autoSurveillants,
    createExamen,
    deleteExamen,
    getChargeSurveillances,
    getExamen,
    getExamens,
    getMesExamens,
    getMesSurveillances,
    publier,
    setSurveillants,
    updateExamen,
    verifierExamen,
} from "../controllers/examenController.js";
import { asyncHandler, authenticateToken, requireAdmin, requireRole, validateExamen } from "../middleware/index.js";

const router = express.Router();

router.use(authenticateToken);

// Vues personnelles (avant /:id)
router.get("/mes-surveillances", requireRole("enseignant"), asyncHandler(getMesSurveillances));
router.get("/mes-examens", requireRole("etudiant"), asyncHandler(getMesExamens));
router.get("/surveillances/charge", requireAdmin, asyncHandler(getChargeSurveillances));

// Administration : épreuves, salles, surveillants, publication
router.get("/", requireAdmin, asyncHandler(getExamens));
router.post("/verifier", requireAdmin, validateExamen(true), asyncHandler(verifierExamen));
router.post("/", requireAdmin, validateExamen(true), asyncHandler(createExamen));
router.get("/:id", requireAdmin, asyncHandler(getExamen));
router.put("/:id", requireAdmin, validateExamen(false), asyncHandler(updateExamen));
router.delete("/:id", requireAdmin, asyncHandler(deleteExamen));
router.post("/:id/surveillants/auto", requireAdmin, asyncHandler(autoSurveillants));
router.put("/:id/surveillants", requireAdmin, asyncHandler(setSurveillants));
router.patch("/:id/publier", requireAdmin, asyncHandler(publier));

export default router;
