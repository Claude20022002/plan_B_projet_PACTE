import express from "express";
import { abandonnerVersionMoteur, annulerVersionMoteur, appliquerVersionMoteur, getValeursMoteur, getVersionsMoteur, postVersionMoteur } from "../controllers/index.js";
import { authenticateToken, requireAdmin, asyncHandler } from "../middleware/index.js";

const router = express.Router();

// Réglages du moteur de planification : réservés à l'administration
router.use(authenticateToken, requireAdmin);

router.get("/valeurs", asyncHandler(getValeursMoteur));
router.get("/versions", asyncHandler(getVersionsMoteur));
router.post("/versions", asyncHandler(postVersionMoteur));
router.post("/versions/:id/appliquer", asyncHandler(appliquerVersionMoteur));
router.post("/versions/:id/abandonner", asyncHandler(abandonnerVersionMoteur));
router.post("/versions/:id/annuler", asyncHandler(annulerVersionMoteur));

export default router;
