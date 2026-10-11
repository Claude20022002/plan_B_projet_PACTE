import express from "express";
import {
    getAllEnseignants,
    getEnseignantById,
    createEnseignant,
    updateEnseignant,
    deleteEnseignant,
    importEnseignants,
    getChargesEnseignants,
    getChargeEnseignant,
    getCompetences,
    setCompetences,
    getDisponibiliteEnseignant,
} from "../controllers/index.js";
import {
    authenticateToken,
    requireAdmin,
    requireEnseignant,
    requireOwnResourceOrAdmin,
    asyncHandler,
    validateEnseignantCreation,
    validateEnseignantUpdate,
    validateCompetences,
    handleValidationErrors,
} from "../middleware/index.js";
import { requireAdminOuResponsable } from "../services/planning/droits.js";
import { mesClasses } from "../services/planning/mesClasses.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

// 🔍 Récupérer tous les enseignants (Admin ou Enseignant)
router.get(
    "/",
    authenticateToken,
    requireEnseignant,
    asyncHandler(getAllEnseignants)
);

// 📊 Charges de tous les enseignants (administration et responsables de filière)
router.get("/charges", authenticateToken, requireAdminOuResponsable, asyncHandler(getChargesEnseignants));

// 🎓 Mes classes (enseignant) : modules × groupes de ses services et de son emploi du temps,
// séance en cours ou prochaine séance d'abord (choix de la classe d'un devoir, d'un quiz)
router.get("/mes-classes", authenticateToken, requireRole("enseignant"), asyncHandler(async (req, res) => res.json(await mesClasses(req.user))));

// 🔍 Récupérer un enseignant par ID (Admin ou propriétaire)
router.get(
    "/:id",
    authenticateToken,
    requireOwnResourceOrAdmin("id"),
    asyncHandler(getEnseignantById)
);

// 📊 Charge d'un enseignant (lui-même ou l'administration)
router.get("/:id/charge", authenticateToken, requireOwnResourceOrAdmin("id"), asyncHandler(getChargeEnseignant));

// 🎓 Compétences : lecture pour l'intéressé, l'administration et les responsables ; écriture par l'administration
router.get("/:id/competences", authenticateToken, requireEnseignant, asyncHandler(getCompetences));
router.put("/:id/competences", authenticateToken, requireAdmin, validateCompetences, asyncHandler(setCompetences));

// 🕐 Disponibilité sur un créneau (règle permanent / vacataire)
router.get("/:id/disponibilite", authenticateToken, requireAdminOuResponsable, asyncHandler(getDisponibiliteEnseignant));

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
    validateEnseignantUpdate,
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
