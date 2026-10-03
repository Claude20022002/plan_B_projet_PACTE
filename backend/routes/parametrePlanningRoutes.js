import express from "express";
import { getParametresPlanning, updateParametrePlanning, resetParametrePlanning } from "../controllers/index.js";
import { authenticateToken, requireAdmin, asyncHandler } from "../middleware/index.js";

const router = express.Router();

// Paramètres de planification : réservés à l'administration
router.use(authenticateToken, requireAdmin);

router.get("/", asyncHandler(getParametresPlanning));
router.put("/:cle", asyncHandler(updateParametrePlanning));
router.delete("/:cle", asyncHandler(resetParametrePlanning));

export default router;
