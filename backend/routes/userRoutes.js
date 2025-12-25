import express from "express";
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} from "../controllers/index.js";
import {
    authenticateToken,
    requireAdmin,
    requireOwnResourceOrAdmin,
    asyncHandler,
    validateUserCreation,
    validateUserUpdate,
    handleValidationErrors,
} from "../middleware/index.js";

const router = express.Router();

// 🔍 Récupérer tous les utilisateurs (Admin seulement)
router.get("/", authenticateToken, requireAdmin, asyncHandler(getAllUsers));

// 🔍 Récupérer un utilisateur par ID (Admin ou propriétaire)
router.get(
    "/:id",
    authenticateToken,
    requireOwnResourceOrAdmin("id"),
    asyncHandler(getUserById)
);

// ➕ Créer un utilisateur (Admin seulement)
router.post(
    "/",
    authenticateToken,
    requireAdmin,
    validateUserCreation,
    handleValidationErrors,
    asyncHandler(createUser)
);

// ✏️ Mettre à jour un utilisateur (Admin ou propriétaire)
router.put(
    "/:id",
    authenticateToken,
    requireOwnResourceOrAdmin("id"),
    validateUserUpdate,
    handleValidationErrors,
    asyncHandler(updateUser)
);

// 🗑️ Supprimer un utilisateur (Admin seulement)
router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    asyncHandler(deleteUser)
);

export default router;
