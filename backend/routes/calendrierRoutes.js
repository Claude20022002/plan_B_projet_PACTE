import express from "express";
import {
    getAnnees,
    createAnnee,
    updateAnnee,
    deleteAnnee,
    createPeriode,
    updatePeriode,
    deletePeriode,
    genererFeries,
} from "../controllers/index.js";
import { authenticateToken, requireAdmin, asyncHandler, validateAnnee, validatePeriode } from "../middleware/index.js";

const router = express.Router();

router.use(authenticateToken);

// 🔍 Années universitaires et leurs semestres (tous les utilisateurs authentifiés)
router.get("/annees", asyncHandler(getAnnees));

// ✏️ Écriture réservée à l'administration
router.post("/annees", requireAdmin, validateAnnee(true), asyncHandler(createAnnee));
router.put("/annees/:id", requireAdmin, validateAnnee(false), asyncHandler(updateAnnee));
router.delete("/annees/:id", requireAdmin, asyncHandler(deleteAnnee));
router.post("/annees/:id/feries", requireAdmin, asyncHandler(genererFeries));

router.post("/annees/:idAnnee/periodes", requireAdmin, validatePeriode(true), asyncHandler(createPeriode));
router.put("/periodes/:id", requireAdmin, validatePeriode(false), asyncHandler(updatePeriode));
router.delete("/periodes/:id", requireAdmin, asyncHandler(deletePeriode));

export default router;
