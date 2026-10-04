import express from "express";
import {
    annulerReservationExistante,
    createReservation,
    getReservation,
    getReservations,
    refuserReservation,
    validerReservationDemandee,
    verifierReservation,
} from "../controllers/reservationController.js";
import { asyncHandler, authenticateToken, requireAdmin, requireEnseignant, validateReservation } from "../middleware/index.js";

const router = express.Router();

router.use(authenticateToken);

// 🔍 Liste et détail (administration : tout ; sinon ses demandes et participations)
router.get("/", asyncHandler(getReservations));
router.get("/:id", asyncHandler(getReservation));

// 🧪 Vérifier, ➕ demander (enseignant) ou réserver (administration)
router.post("/verifier", requireEnseignant, validateReservation, asyncHandler(verifierReservation));
router.post("/", requireEnseignant, validateReservation, asyncHandler(createReservation));

// ✅ Valider, ❌ refuser (administration) ; 🚫 annuler (demandeur ou administration)
router.patch("/:id/valider", requireAdmin, asyncHandler(validerReservationDemandee));
router.patch("/:id/refuser", requireAdmin, asyncHandler(refuserReservation));
router.patch("/:id/annuler", asyncHandler(annulerReservationExistante));

export default router;
