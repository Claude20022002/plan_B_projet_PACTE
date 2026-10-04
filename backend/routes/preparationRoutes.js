import express from "express";
import { getPreparation, postRelancer } from "../controllers/preparationController.js";
import { authenticateToken } from "../middleware/index.js";
import { autoriserFiliere, filiereDuCorps, requireAdminOuResponsable } from "../services/planning/droits.js";

const router = express.Router();

// Préparation du semestre : administration, et responsables pour leurs filières
router.use(authenticateToken, requireAdminOuResponsable);

router.get("/", getPreparation);
router.post("/relancer", autoriserFiliere(filiereDuCorps), postRelancer);

export default router;
