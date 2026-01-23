import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/index.js";
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

// 🔍 Récupérer toutes les demandes de report
router.get("/", asyncHandler(getAllDemandesReport));

// 🔍 Récupérer une demande de report par ID
router.get("/:id", asyncHandler(getDemandeReportById));

// ➕ Créer une demande de report
router.post("/", asyncHandler(createDemandeReport));

// ✏️ Mettre à jour une demande de report
router.put("/:id", asyncHandler(updateDemandeReport));

// 🗑️ Supprimer une demande de report
router.delete("/:id", asyncHandler(deleteDemandeReport));

// 🔍 Récupérer les demandes de report par enseignant
router.get("/enseignant/:id_enseignant", asyncHandler(getDemandesReportByEnseignant));

// 🔍 Récupérer les demandes de report par statut
router.get("/statut/:statut", asyncHandler(getDemandesReportByStatut));

// ✅ Traiter une demande de report (approuver ou refuser) - Admin seulement
router.patch(
    "/:id/traiter",
    authenticateToken,
    requireAdmin,
    asyncHandler(traiterDemandeReport)
);

export default router;
