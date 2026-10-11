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
import { asyncHandler, authenticateToken, requireAdmin, validateReservation } from "../middleware/index.js";

const router = express.Router();

router.use(authenticateToken);

// 🔍 Liste et détail (administration : tout ; sinon ses demandes et participations)
router.get("/", asyncHandler(getReservations));
router.get("/:id", asyncHandler(getReservation));

// 🧪 Vérifier et ➕ réserver : l'administration seulement. Les enseignants ne réservent pas de salle
// (règle du 10 octobre 2026) ; ils voient encore les réservations où ils participent (jury, réunion).
router.post("/verifier", requireAdmin, validateReservation, asyncHandler(verifierReservation));
router.post("/", requireAdmin, validateReservation, asyncHandler(createReservation));

// ✅ Valider, ❌ refuser (administration : demandes anciennes encore en attente) ; 🚫 annuler
// (demandeur ou administration)
router.patch("/:id/valider", requireAdmin, asyncHandler(validerReservationDemandee));
router.patch("/:id/refuser", requireAdmin, asyncHandler(refuserReservation));
router.patch("/:id/annuler", asyncHandler(annulerReservationExistante));

export default router;
