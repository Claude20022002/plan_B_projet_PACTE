import express from "express";
import { reinitialiser as reinitialiserMfa } from "../services/mfa.js";
import { contexteDe } from "../services/journalSecurite.js";
import { planification } from "../utils/erreursPlanning.js";
import { apercuDesactivation } from "../services/desactivation/apercu.js";
import { annulerProgrammation, desactiver, desactiverEnLot, reactiver } from "../services/desactivation/desactivation.js";
import { anonymiser } from "../services/desactivation/anonymisation.js";
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    importUsers,
} from "../controllers/index.js";
import {
    authenticateToken,
    requireAdmin,
    requireOwnResourceOrAdmin,
    asyncHandler,
    validateUserCreation,
    validateUserUpdate,
    handleValidationErrors,
} from "../middleware/index.js";

const router = express.Router();

// 🔍 Récupérer tous les utilisateurs (Admin seulement)
router.get("/", authenticateToken, requireAdmin, asyncHandler(getAllUsers));

// 🔍 Récupérer un utilisateur par ID (Admin ou propriétaire)
router.get(
    "/:id",
    authenticateToken,
    requireOwnResourceOrAdmin("id"),
    asyncHandler(getUserById)
);

// ➕ Créer un utilisateur (Admin seulement)
router.post(
    "/",
    authenticateToken,
    requireAdmin,
    validateUserCreation,
    handleValidationErrors,
    asyncHandler(createUser)
);

// ✏️ Mettre à jour un utilisateur (Admin ou propriétaire)
router.put(
    "/:id",
    authenticateToken,
    requireOwnResourceOrAdmin("id"),
    validateUserUpdate,
    handleValidationErrors,
    asyncHandler(updateUser)
);

// Réinitialiser la double authentification d'un compte (téléphone perdu) : sessions fermées (Admin seulement)
router.delete(
    "/:id/mfa",
    authenticateToken,
    requireAdmin,
    planification(async (req, res) => res.json(await reinitialiserMfa(req.user, req.params.id, contexteDe(req))))
);

// Désactivation des comptes (lot ME-17, Admin seulement) : aperçu de ce qu'elle touche, désactivation
// immédiate ou programmée, annulation d'une programmation, réactivation, anonymisation, lot
const admin = [authenticateToken, requireAdmin];
router.get("/:id/desactivation", ...admin, planification(async (req, res) => res.json(await apercuDesactivation(req.params.id, { date: req.query.date }))));
router.post("/:id/desactivation", ...admin, planification(async (req, res) => res.json(await desactiver(req.user, req.params.id, req.body ?? {}, contexteDe(req)))));
router.delete("/:id/desactivation", ...admin, planification(async (req, res) => res.json(await annulerProgrammation(req.user, req.params.id, contexteDe(req)))));
router.post("/:id/reactivation", ...admin, planification(async (req, res) => res.json(await reactiver(req.user, req.params.id, contexteDe(req)))));
router.post("/:id/anonymisation", ...admin, planification(async (req, res) => res.json(await anonymiser(req.user, req.params.id, contexteDe(req)))));
router.post("/desactivations", ...admin, planification(async (req, res) => res.json(await desactiverEnLot(req.user, req.body ?? {}, contexteDe(req)))));

// 🗑️ Supprimer un utilisateur (Admin seulement) : seulement un compte sans historique (sinon le désactiver)
router.delete(
    "/:id",
    authenticateToken,
    requireAdmin,
    asyncHandler(deleteUser)
);

// 📥 Importer des utilisateurs en masse (Admin seulement)
router.post(
    "/import",
    authenticateToken,
    requireAdmin,
    asyncHandler(importUsers)
);

export default router;
