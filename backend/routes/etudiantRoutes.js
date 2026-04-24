import express from "express";
import {
    getAllEtudiants,
    getEtudiantById,
    createEtudiant,
    updateEtudiant,
    deleteEtudiant,
    importEtudiants,
    syncGroupesEtudiants,
} from "../controllers/index.js";
import {
    authenticateToken,
    requireAdmin,
    requireEnseignant,
    requireOwnResourceOrAdmin,
    asyncHandler,
    validateEtudiantCreation,
    handleValidationErrors,
} from "../middleware/index.js";

const router = express.Router();

// 🔍 Récupérer tous les étudiants (Admin ou Enseignant)
router.get(
    "/",
    authenticateToken,
    requireEnseignant,
    asyncHandler(getAllEtudiants)
);

// 🔍 Récupérer un étudiant par ID (Admin ou propriétaire)
router.get(
    "/:id",
    authenticateToken,
    requireOwnResourceOrAdmin("id"),
    asyncHandler(getEtudiantById)
);

// ➕ Créer un étudiant (Admin seulement)
router.post(
    "/",
    authenticateToken,
    requireAdmin,
    validateEtudiantCreation,
    handleValidationErrors,
    asyncHandler(createEtudiant)
);

// ✏️ Mettre à jour un étudiant (Admin ou propriétaire)
router.put(
    "/:id",
    authenticateToken,
    requireOwnResourceOrAdmin("id"),
    handleValidationErrors,
    asyncHandler(updateEtudiant)
);

// 🗑️ Supprimer un étudiant (Admin seulement)
router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    asyncHandler(deleteEtudiant)
);

// 📥 Importer des étudiants en masse (Admin seulement)
router.post(
    "/import",
    authenticateToken,
    requireAdmin,
    asyncHandler(importEtudiants)
);

// 🔧 Réparer les liens groupe manquants (Admin seulement)
router.post(
    "/sync-groupes",
    authenticateToken,
    requireAdmin,
    asyncHandler(syncGroupesEtudiants)
);

export default router;
