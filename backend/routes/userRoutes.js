import express from "express";
import { reinitialiser as reinitialiserMfa } from "../services/mfa.js";
import { contexteDe } from "../services/journalSecurite.js";
import { planification } from "../utils/erreursPlanning.js";
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    importUsers,
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

// Réinitialiser la double authentification d'un compte (téléphone perdu) : sessions fermées (Admin seulement)
router.delete(
    "/:id/mfa",
    authenticateToken,
    requireAdmin,
    planification(async (req, res) => res.json(await reinitialiserMfa(req.user, req.params.id, contexteDe(req))))
);

// 🗑️ Supprimer un utilisateur (Admin seulement)
router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    asyncHandler(deleteUser)
);

// 📥 Importer des utilisateurs en masse (Admin seulement)
router.post(
    "/import",
    authenticateToken,
    requireAdmin,
    asyncHandler(importUsers)
);

export default router;
