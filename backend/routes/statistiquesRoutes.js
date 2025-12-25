import express from "express";
import {
    getOccupationSalles,
    getOccupationSalle,
    getFrequenceSalles,
    getHeuresCreuses,
    getPicsActivite,
    getChargeEnseignants,
    getOccupationGroupes,
    getDashboard,
} from "../controllers/statistiquesController.js";
import { authenticateToken, requireAdmin } from "../middleware/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

// 📊 GET /api/statistiques/salles/occupation - Taux d'occupation global
router.get(
    "/salles/occupation",
    authenticateToken,
    requireAdmin,
    asyncHandler(getOccupationSalles)
);

// 📊 GET /api/statistiques/salles/:id/occupation - Occupation d'une salle
router.get(
    "/salles/:id/occupation",
    authenticateToken,
    requireAdmin,
    asyncHandler(getOccupationSalle)
);

// 📊 GET /api/statistiques/salles/frequence - Fréquence d'utilisation
router.get(
    "/salles/frequence",
    authenticateToken,
    requireAdmin,
    asyncHandler(getFrequenceSalles)
);

// 📊 GET /api/statistiques/activite/heures-creuses - Heures creuses
router.get(
    "/activite/heures-creuses",
    authenticateToken,
    requireAdmin,
    asyncHandler(getHeuresCreuses)
);

// 📊 GET /api/statistiques/activite/pics - Pics d'activité
router.get(
    "/activite/pics",
    authenticateToken,
    requireAdmin,
    asyncHandler(getPicsActivite)
);

// 📊 GET /api/statistiques/enseignants/charge - Charge de travail
router.get(
    "/enseignants/charge",
    authenticateToken,
    requireAdmin,
    asyncHandler(getChargeEnseignants)
);

// 📊 GET /api/statistiques/groupes/occupation - Occupation par groupe
router.get(
    "/groupes/occupation",
    authenticateToken,
    requireAdmin,
    asyncHandler(getOccupationGroupes)
);

// 📊 GET /api/statistiques/dashboard - Tableau de bord complet
router.get(
    "/dashboard",
    authenticateToken,
    requireAdmin,
    asyncHandler(getDashboard)
);

export default router;

