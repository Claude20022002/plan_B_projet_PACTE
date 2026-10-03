import express from "express";
import {
    getEvenements,
    getEvenementById,
    createEvenement,
    updateEvenement,
    confirmerEvenement,
    deleteEvenement,
} from "../controllers/index.js";
import {
    authenticateToken,
    requireAdmin,
    asyncHandler,
    validateEvenement,
    validateConfirmationEvenement,
} from "../middleware/index.js";

const router = express.Router();

router.use(authenticateToken);

// 🔍 Calendrier : vacances, fériés, examens, Ramadan… (tous les utilisateurs authentifiés)
router.get("/", asyncHandler(getEvenements));
router.get("/:id", asyncHandler(getEvenementById));

// ✏️ Écriture réservée à l'administration
router.post("/", requireAdmin, validateEvenement(true), asyncHandler(createEvenement));
router.put("/:id", requireAdmin, validateEvenement(false), asyncHandler(updateEvenement));
router.patch("/:id/confirmer", requireAdmin, validateConfirmationEvenement, asyncHandler(confirmerEvenement));
router.delete("/:id", requireAdmin, asyncHandler(deleteEvenement));

export default router;
