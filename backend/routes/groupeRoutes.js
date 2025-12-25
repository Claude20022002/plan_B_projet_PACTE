import express from "express";
import {
    getAllGroupes,
    getGroupeById,
    createGroupe,
    updateGroupe,
    deleteGroupe,
} from "../controllers/index.js";
import {
    authenticateToken,
    requireAdmin,
    asyncHandler,
    validateGroupeCreation,
    handleValidationErrors,
} from "../middleware/index.js";

const router = express.Router();

// 🔍 Récupérer tous les groupes (Tous les utilisateurs authentifiés)
router.get("/", authenticateToken, asyncHandler(getAllGroupes));

// 🔍 Récupérer un groupe par ID (Tous les utilisateurs authentifiés)
router.get("/:id", authenticateToken, asyncHandler(getGroupeById));

// ➕ Créer un groupe (Admin seulement)
router.post(
    "/",
    authenticateToken,
    requireAdmin,
    validateGroupeCreation,
    handleValidationErrors,
    asyncHandler(createGroupe)
);

// ✏️ Mettre à jour un groupe (Admin seulement)
router.put(
    "/:id",
    authenticateToken,
    requireAdmin,
    handleValidationErrors,
    asyncHandler(updateGroupe)
);

// 🗑️ Supprimer un groupe (Admin seulement)
router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    asyncHandler(deleteGroupe)
);

export default router;
