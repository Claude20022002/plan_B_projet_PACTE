import express from "express";
import {
    getAllSalles,
    getSalleById,
    createSalle,
    updateSalle,
    deleteSalle,
    getSallesDisponibles,
} from "../controllers/index.js";
import {
    authenticateToken,
    requireAdmin,
    asyncHandler,
    validateSalleCreation,
    handleValidationErrors,
} from "../middleware/index.js";

const router = express.Router();

// 🔍 Récupérer toutes les salles (Tous les utilisateurs authentifiés)
router.get("/", authenticateToken, asyncHandler(getAllSalles));

// 🔍 Récupérer les salles disponibles (Tous les utilisateurs authentifiés)
router.get(
    "/disponibles/liste",
    authenticateToken,
    asyncHandler(getSallesDisponibles)
);

// 🔍 Récupérer une salle par ID (Tous les utilisateurs authentifiés)
router.get("/:id", authenticateToken, asyncHandler(getSalleById));

// ➕ Créer une salle (Admin seulement)
router.post(
    "/",
    authenticateToken,
    requireAdmin,
    validateSalleCreation,
    handleValidationErrors,
    asyncHandler(createSalle)
);

// ✏️ Mettre à jour une salle (Admin seulement)
router.put(
    "/:id",
    authenticateToken,
    requireAdmin,
    handleValidationErrors,
    asyncHandler(updateSalle)
);

// 🗑️ Supprimer une salle (Admin seulement)
router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    asyncHandler(deleteSalle)
);

export default router;
