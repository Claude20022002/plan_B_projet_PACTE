import express from "express";
import {
    getAllFilieres,
    getFiliereById,
    createFiliere,
    updateFiliere,
    deleteFiliere,
} from "../controllers/index.js";
import {
    authenticateToken,
    requireAdmin,
    asyncHandler,
    validateFiliereCreation,
    handleValidationErrors,
} from "../middleware/index.js";

const router = express.Router();

// 🔍 Récupérer toutes les filières (Tous les utilisateurs authentifiés)
router.get("/", authenticateToken, asyncHandler(getAllFilieres));

// 🔍 Récupérer une filière par ID (Tous les utilisateurs authentifiés)
router.get("/:id", authenticateToken, asyncHandler(getFiliereById));

// ➕ Créer une filière (Admin seulement)
router.post(
    "/",
    authenticateToken,
    requireAdmin,
    validateFiliereCreation,
    handleValidationErrors,
    asyncHandler(createFiliere)
);

// ✏️ Mettre à jour une filière (Admin seulement)
router.put(
    "/:id",
    authenticateToken,
    requireAdmin,
    handleValidationErrors,
    asyncHandler(updateFiliere)
);

// 🗑️ Supprimer une filière (Admin seulement)
router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    asyncHandler(deleteFiliere)
);

export default router;
