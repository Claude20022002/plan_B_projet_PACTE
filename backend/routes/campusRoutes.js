import express from "express";
import {
    getAllCampus,
    createCampus,
    updateCampus,
    deleteCampus,
    getTrajets,
    upsertTrajet,
} from "../controllers/index.js";
import { authenticateToken, requireAdmin, asyncHandler, validateCampus, validateTrajet } from "../middleware/index.js";

const router = express.Router();

router.use(authenticateToken);

// 🔍 Campus et temps de trajet (tous les utilisateurs authentifiés)
router.get("/", asyncHandler(getAllCampus));
router.get("/trajets", asyncHandler(getTrajets));

// ✏️ Écriture réservée à l'administration
router.put("/trajets", requireAdmin, validateTrajet, asyncHandler(upsertTrajet));
router.post("/", requireAdmin, validateCampus(true), asyncHandler(createCampus));
router.put("/:id", requireAdmin, validateCampus(false), asyncHandler(updateCampus));
router.delete("/:id", requireAdmin, asyncHandler(deleteCampus));

export default router;
