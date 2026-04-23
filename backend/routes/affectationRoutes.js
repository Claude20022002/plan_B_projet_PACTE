import express from "express";
import {
    getAllAffectations,
    getAffectationById,
    createAffectation,
    updateAffectation,
    deleteAffectation,
    confirmerAffectation,
    getAffectationsByEnseignant,
    getAffectationsByGroupe,
} from "../controllers/index.js";
import {
    authenticateToken,
    requireAdmin,
    requireOwnResourceOrAdmin,
    asyncHandler,
    validateAffectationCreation,
    handleValidationErrors,
} from "../middleware/index.js";

const router = express.Router();

// 🔍 Récupérer toutes les affectations (Tous les utilisateurs authentifiés)
router.get("/", authenticateToken, asyncHandler(getAllAffectations));

// 🔍 Récupérer une affectation par ID (Tous les utilisateurs authentifiés)
router.get("/:id", authenticateToken, asyncHandler(getAffectationById));

// ➕ Créer une affectation (Admin seulement)
router.post(
    "/",
    authenticateToken,
    requireAdmin,
    validateAffectationCreation,
    handleValidationErrors,
    asyncHandler(createAffectation)
);

// ✏️ Mettre à jour une affectation (Admin seulement)
router.put(
    "/:id",
    authenticateToken,
    requireAdmin,
    handleValidationErrors,
    asyncHandler(updateAffectation)
);

// 🗑️ Supprimer une affectation (Admin seulement)
router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    asyncHandler(deleteAffectation)
);

// ✅ Confirmer une affectation (Enseignant propriétaire ou Admin)
router.patch(
    "/:id/confirmer",
    authenticateToken,
    asyncHandler(confirmerAffectation)
);

// 🔍 Récupérer les affectations par enseignant (Enseignant propriétaire ou Admin)
router.get(
    "/enseignant/:id_enseignant",
    authenticateToken,
    requireOwnResourceOrAdmin("id_enseignant"),
    asyncHandler(getAffectationsByEnseignant)
);

// 🔍 Récupérer les affectations par groupe (Tous les utilisateurs authentifiés)
router.get(
    "/groupe/:id_groupe",
    authenticateToken,
    asyncHandler(getAffectationsByGroupe)
);

export default router;
