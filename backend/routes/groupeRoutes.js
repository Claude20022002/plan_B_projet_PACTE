import express from "express";
import {
    getAllGroupes,
    getGroupeById,
    createGroupe,
    updateGroupe,
    deleteGroupe,
    getArbreGroupes,
} from "../controllers/index.js";
import {
    authenticateToken,
    asyncHandler,
    validateGroupeCreation,
    validateGroupeUpdate,
} from "../middleware/index.js";
import { autoriserFiliere, filiereDuCorps, requireAdminOuResponsable } from "../services/planning/droits.js";
import { filiereDuGroupe } from "../services/planning/resolveursFiliere.js";

const router = express.Router();

// 🔍 Récupérer tous les groupes (Tous les utilisateurs authentifiés)
router.get("/", authenticateToken, asyncHandler(getAllGroupes));

// 🌳 Arbre promotions → TD → TP (Tous les utilisateurs authentifiés)
router.get("/arbre", authenticateToken, asyncHandler(getArbreGroupes));

// 🔍 Récupérer un groupe par ID (Tous les utilisateurs authentifiés)
router.get("/:id", authenticateToken, asyncHandler(getGroupeById));

// ✏️ Groupes : administration, et responsable pour les groupes de sa filière
const gestion = [authenticateToken, requireAdminOuResponsable];

router.post("/", ...gestion, validateGroupeCreation, autoriserFiliere(filiereDuCorps), asyncHandler(createGroupe));
router.put("/:id", ...gestion, validateGroupeUpdate, autoriserFiliere(filiereDuGroupe), asyncHandler(updateGroupe));
router.delete("/:id", ...gestion, autoriserFiliere(filiereDuGroupe), asyncHandler(deleteGroupe));

export default router;
