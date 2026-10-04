import express from "express";
import {
    creneauxPourReservation,
    creneauxPourSeance,
    getJour,
    getRemplacants,
    postAbsence,
    postAnnulerJour,
    postReloger,
    postRemplacer,
} from "../controllers/imprevuController.js";
import { authenticateToken, requireAdmin, requireEnseignant } from "../middleware/index.js";

const router = express.Router();

router.use(authenticateToken);

// 🧭 Assistant de créneaux (I8) : séance (administration, ou enseignant pour sa séance), réservation
router.post("/assistant/seances", requireEnseignant, creneauxPourSeance);
router.post("/assistant/reservations", requireEnseignant, creneauxPourReservation);

// 🤒 Absence : l'enseignant pour lui-même, l'administration pour tous
router.post("/absences", requireEnseignant, postAbsence);

// Administration : remplaçants, salle hors service, journée à annuler
router.get("/seances/:id/remplacants", requireAdmin, getRemplacants);
router.post("/seances/:id/remplacer", requireAdmin, postRemplacer);
router.post("/salles/:id/reloger", requireAdmin, postReloger);
router.get("/jour/:date", requireAdmin, getJour);
router.post("/jour/:date/annuler", requireAdmin, postAnnulerJour);

export default router;
