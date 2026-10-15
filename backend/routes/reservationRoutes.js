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

// La réservation de salles est propre à l'administration (décision du 15 octobre 2026, après celle
// du 10 octobre qui retirait déjà la création aux enseignants) : consulter, vérifier, réserver,
// valider, refuser et annuler lui sont réservés. Les participants (jury, réunion) restent prévenus
// par notification quand une réservation qui les concerne est validée ou annulée.
router.use(authenticateToken, requireAdmin);

// 🔍 Liste et détail
router.get("/", asyncHandler(getReservations));
router.get("/:id", asyncHandler(getReservation));

// 🧪 Vérifier et ➕ réserver
router.post("/verifier", validateReservation, asyncHandler(verifierReservation));
router.post("/", validateReservation, asyncHandler(createReservation));

// ✅ Valider, ❌ refuser (demandes anciennes encore en attente) ; 🚫 annuler
router.patch("/:id/valider", asyncHandler(validerReservationDemandee));
router.patch("/:id/refuser", asyncHandler(refuserReservation));
router.patch("/:id/annuler", asyncHandler(annulerReservationExistante));

export default router;
