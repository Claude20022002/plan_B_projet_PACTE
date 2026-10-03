import express from "express";
import {
    getAllCours,
    getCoursById,
    createCours,
    updateCours,
    deleteCours,
    getComposantesDuCours,
    createComposante,
} from "../controllers/index.js";
import {
    authenticateToken,
    requireAdmin,
    asyncHandler,
    validateCoursCreation,
    validateCoursUpdate,
    validateComposante,
    handleValidationErrors,
} from "../middleware/index.js";

const router = express.Router();

// 🔍 Récupérer tous les cours (Tous les utilisateurs authentifiés)
router.get("/", authenticateToken, asyncHandler(getAllCours));

// 🔍 Récupérer un cours par ID (Tous les utilisateurs authentifiés)
router.get("/:id", authenticateToken, asyncHandler(getCoursById));

// ➕ Créer un cours (Admin seulement)
router.post(
    "/",
    authenticateToken,
    requireAdmin,
    validateCoursCreation,
    handleValidationErrors,
    asyncHandler(createCours)
);

// ✏️ Mettre à jour un cours (Admin seulement)
router.put(
    "/:id",
    authenticateToken,
    requireAdmin,
    validateCoursUpdate,
    asyncHandler(updateCours)
);

// 🗑️ Supprimer un cours (Admin seulement)
router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    asyncHandler(deleteCours)
);

// 🧩 Composantes d'un module (CM, TD, TP, Projet)
router.get("/:idCours/composantes", authenticateToken, asyncHandler(getComposantesDuCours));
router.post("/:idCours/composantes", authenticateToken, requireAdmin, validateComposante(true), asyncHandler(createComposante));

export default router;
