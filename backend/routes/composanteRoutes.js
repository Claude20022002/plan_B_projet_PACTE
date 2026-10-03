import express from "express";
import { updateComposante, deleteComposante } from "../controllers/index.js";
import { authenticateToken, asyncHandler, validateComposante } from "../middleware/index.js";
import { autoriserFiliere, requireAdminOuResponsable } from "../services/planning/droits.js";
import { filiereDeLaComposante } from "../services/planning/resolveursFiliere.js";

const router = express.Router();

// Composantes d'un module (création et liste : /api/cours/:idCours/composantes) :
// administration, et responsable pour les modules de sa filière
router.use(authenticateToken, requireAdminOuResponsable);

router.put("/:id", validateComposante(false), autoriserFiliere(filiereDeLaComposante), asyncHandler(updateComposante));
router.delete("/:id", autoriserFiliere(filiereDeLaComposante), asyncHandler(deleteComposante));

export default router;
