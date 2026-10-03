import express from "express";
import {
    getEnseignements,
    genererDepuisMaquette,
    fusionner,
    scinder,
    updateEnseignement,
    deleteEnseignement,
} from "../controllers/index.js";
import {
    authenticateToken,
    requireAdmin,
    asyncHandler,
    validateGenerationEnseignements,
    validateFusionEnseignements,
    validateEnseignementUpdate,
} from "../middleware/index.js";

const router = express.Router();

// Enseignements (composante × groupes) : préparation du semestre, réservée à l'administration
router.use(authenticateToken, requireAdmin);

router.get("/", asyncHandler(getEnseignements));
router.post("/generer", validateGenerationEnseignements, asyncHandler(genererDepuisMaquette));
router.post("/fusionner", validateFusionEnseignements, asyncHandler(fusionner));
router.post("/:id/scinder", asyncHandler(scinder));
router.put("/:id", validateEnseignementUpdate, asyncHandler(updateEnseignement));
router.delete("/:id", asyncHandler(deleteEnseignement));

export default router;
