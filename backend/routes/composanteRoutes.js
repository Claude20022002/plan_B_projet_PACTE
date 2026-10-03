import express from "express";
import { updateComposante, deleteComposante } from "../controllers/index.js";
import { authenticateToken, requireAdmin, asyncHandler, validateComposante } from "../middleware/index.js";

const router = express.Router();

// Composantes d'un module (création et liste : /api/cours/:idCours/composantes)
router.use(authenticateToken, requireAdmin);

router.put("/:id", validateComposante(false), asyncHandler(updateComposante));
router.delete("/:id", asyncHandler(deleteComposante));

export default router;
