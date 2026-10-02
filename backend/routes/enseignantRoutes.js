import express from "express";
import {
    getAllEnseignants,
    getEnseignantById,
    createEnseignant,
    updateEnseignant,
    deleteEnseignant,
    importEnseignants,
} from "../controllers/index.js";
import {
    authenticateToken,
    requireAdmin,
    requireEnseignant,
    requireOwnResourceOrAdmin,
    asyncHandler,
    validateEnseignantCreation,
    handleValidationErrors,
} from "../middleware/index.js";

const router = express.Router();

// 🔍 Récupérer tous les enseignants (Admin ou Enseignant)
router.get(
    "/",
    authenticateToken,
    requireEnseignant,
    asyncHandler(getAllEnseignants)
);

// 🔍 Récupérer un enseignant par ID (Admin ou propriétaire)
router.get(
    "/:id",
    authenticateToken,
    requireOwnResourceOrAdmin("id"),
    asyncHandler(getEnseignantById)
);

// ➕ Créer un enseignant (Admin seulement)
router.post(
    "/",
    authenticateToken,
    requireAdmin,
    validateEnseignantCreation,
    handleValidationErrors,
    asyncHandler(createEnseignant)
);

// ✏️ Mettre à jour un enseignant (Admin seulement — le profil personnel passe par /api/users)
router.put(
    "/:id",
    authenticateToken,
    requireAdmin,
    handleValidationErrors,
    asyncHandler(updateEnseignant)
);

// 🗑️ Supprimer un enseignant (Admin seulement)
router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    asyncHandler(deleteEnseignant)
);

// 📥 Importer des enseignants en masse (Admin seulement)
router.post(
    "/import",
    authenticateToken,
    requireAdmin,
    asyncHandler(importEnseignants)
);

export default router;
