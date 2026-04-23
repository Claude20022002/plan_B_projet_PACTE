import express from "express";
import {
    getAllCreneaux,
    getCreneauById,
    createCreneau,
    updateCreneau,
    deleteCreneau,
} from "../controllers/index.js";
import {
    authenticateToken,
    requireAdmin,
    asyncHandler,
    validateCreneauCreation,
    handleValidationErrors,
} from "../middleware/index.js";

const router = express.Router();

// 🔍 Récupérer tous les créneaux (Tous les utilisateurs authentifiés)
router.get("/", authenticateToken, asyncHandler(getAllCreneaux));

// 🔍 Récupérer un créneau par ID (Tous les utilisateurs authentifiés)
router.get("/:id", authenticateToken, asyncHandler(getCreneauById));

// ➕ Créer un créneau (tout utilisateur authentifié — utilisé par enseignants pour les disponibilités)
router.post(
    "/",
    authenticateToken,
    validateCreneauCreation,
    handleValidationErrors,
    asyncHandler(createCreneau)
);

// ✏️ Mettre à jour un créneau (Admin seulement)
router.put(
    "/:id",
    authenticateToken,
    requireAdmin,
    handleValidationErrors,
    asyncHandler(updateCreneau)
);

// 🗑️ Supprimer un créneau (Admin seulement)
router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    asyncHandler(deleteCreneau)
);

export default router;
