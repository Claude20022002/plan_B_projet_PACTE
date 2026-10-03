import express from "express";
import {
    getAllFilieres,
    getFiliereById,
    createFiliere,
    updateFiliere,
    deleteFiliere,
    getResponsables,
    ajouterResponsable,
    retirerResponsable,
} from "../controllers/index.js";
import {
    authenticateToken,
    requireAdmin,
    asyncHandler,
    validateFiliereCreation,
    validateFiliereUpdate,
    handleValidationErrors,
} from "../middleware/index.js";

const router = express.Router();

// 👤 Responsables de filière : lecture pour tous, nomination par l'administration
router.get("/:id/responsables", authenticateToken, asyncHandler(getResponsables));
router.post("/:id/responsables", authenticateToken, requireAdmin, asyncHandler(ajouterResponsable));
router.delete("/:id/responsables/:idUser", authenticateToken, requireAdmin, asyncHandler(retirerResponsable));

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
    validateFiliereUpdate,
    handleValidationErrors,
    asyncHandler(createFiliere)
);

// ✏️ Mettre à jour une filière (Admin seulement)
router.put(
    "/:id",
    authenticateToken,
    requireAdmin,
    validateFiliereUpdate,
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
