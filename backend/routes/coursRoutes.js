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
    asyncHandler,
    validateCoursCreation,
    validateCoursUpdate,
    validateComposante,
} from "../middleware/index.js";
import { autoriserFiliere, filiereDuCorps, requireAdminOuResponsable } from "../services/planning/droits.js";
import { filiereDuCours } from "../services/planning/resolveursFiliere.js";

const router = express.Router();

// 🔍 Récupérer tous les cours (Tous les utilisateurs authentifiés)
router.get("/", authenticateToken, asyncHandler(getAllCours));

// 🔍 Récupérer un cours par ID (Tous les utilisateurs authentifiés)
router.get("/:id", authenticateToken, asyncHandler(getCoursById));

// ✏️ Maquette : administration, et responsable pour les modules de sa filière
const gestion = [authenticateToken, requireAdminOuResponsable];

router.post("/", ...gestion, validateCoursCreation, autoriserFiliere(filiereDuCorps), asyncHandler(createCours));
router.put("/:id", ...gestion, validateCoursUpdate, autoriserFiliere(filiereDuCours), asyncHandler(updateCours));
router.delete("/:id", ...gestion, autoriserFiliere(filiereDuCours), asyncHandler(deleteCours));

// 🧩 Composantes d'un module (CM, TD, TP, Projet)
router.get("/:idCours/composantes", authenticateToken, asyncHandler(getComposantesDuCours));
router.post("/:idCours/composantes", ...gestion, validateComposante(true), autoriserFiliere(filiereDuCours), asyncHandler(createComposante));

export default router;
