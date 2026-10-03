import express from "express";
import { getMesServices, repondreService } from "../controllers/index.js";
import { authenticateToken, requireRole, asyncHandler } from "../middleware/index.js";

const router = express.Router();

// Espace enseignant : services proposés, acceptés ou refusés
router.use(authenticateToken, requireRole("enseignant"));

router.get("/mes-services", asyncHandler(getMesServices));
router.patch("/:id/reponse", asyncHandler(repondreService));

export default router;
