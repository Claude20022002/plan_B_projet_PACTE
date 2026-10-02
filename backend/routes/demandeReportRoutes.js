import express from "express";
import {
    authenticateToken,
    requireAdmin,
    requireEnseignant,
    requireOwnResourceOrAdmin,
} from "../middleware/index.js";
import {
    getAllDemandesReport,
    getDemandeReportById,
    createDemandeReport,
    updateDemandeReport,
    deleteDemandeReport,
    getDemandesReportByEnseignant,
    getDemandesReportByStatut,
    traiterDemandeReport,
} from "../controllers/demandeReportController.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

router.use(authenticateToken);

// 🔍 Récupérer toutes les demandes de report (admin)
router.get("/", requireAdmin, asyncHandler(getAllDemandesReport));

// 🔍 Récupérer les demandes de report par enseignant (l'enseignant concerné ou admin)
router.get(
    "/enseignant/:id_enseignant",
    requireOwnResourceOrAdmin("id_enseignant"),
    asyncHandler(getDemandesReportByEnseignant)
);

// 🔍 Récupérer les demandes de report par statut (admin)
router.get("/statut/:statut", requireAdmin, asyncHandler(getDemandesReportByStatut));

// 🔍 Récupérer une demande de report par ID (propriétaire ou admin, contrôlé dans le contrôleur)
router.get("/:id", asyncHandler(getDemandeReportById));

// ➕ Créer une demande de report (enseignant, pour ses propres séances)
router.post("/", requireEnseignant, asyncHandler(createDemandeReport));

// ✏️ Mettre à jour / 🗑️ supprimer une demande en attente (propriétaire ou admin)
router.put("/:id", requireEnseignant, asyncHandler(updateDemandeReport));
router.delete("/:id", requireEnseignant, asyncHandler(deleteDemandeReport));

// ✅ Traiter une demande de report (approuver ou refuser) - Admin seulement
router.patch("/:id/traiter", requireAdmin, asyncHandler(traiterDemandeReport));

export default router;
