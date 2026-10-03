import express from "express";
import {
    getAllSalles,
    getSalleById,
    createSalle,
    updateSalle,
    deleteSalle,
    getSallesDisponibles,
    getReferentielSalles,
    importSalles,
} from "../controllers/index.js";
import {
    authenticateToken,
    requireAdmin,
    asyncHandler,
    validateSalleCreation,
    validateSalleUpdate,
} from "../middleware/index.js";

const router = express.Router();

// 🔍 Récupérer toutes les salles (Tous les utilisateurs authentifiés)
router.get("/", authenticateToken, asyncHandler(getAllSalles));

// 🔍 Listes fermées des formulaires : types de salle, droits de réservation
router.get("/referentiel", authenticateToken, asyncHandler(getReferentielSalles));

// 🔍 Récupérer les salles disponibles (Tous les utilisateurs authentifiés)
router.get(
    "/disponibles/liste",
    authenticateToken,
    asyncHandler(getSallesDisponibles)
);

// 📥 Importer l'inventaire des salles (Admin seulement, tout ou rien)
router.post("/import", authenticateToken, requireAdmin, asyncHandler(importSalles));

// 🔍 Récupérer une salle par ID (Tous les utilisateurs authentifiés)
router.get("/:id", authenticateToken, asyncHandler(getSalleById));

// ➕ Créer une salle (Admin seulement)
router.post(
    "/",
    authenticateToken,
    requireAdmin,
    validateSalleCreation,
    asyncHandler(createSalle)
);

// ✏️ Mettre à jour une salle (Admin seulement)
router.put(
    "/:id",
    authenticateToken,
    requireAdmin,
    validateSalleUpdate,
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
