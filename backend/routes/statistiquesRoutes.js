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
    getKPIs,
    perimetreStatistiques,
} from "../controllers/statistiquesController.js";
import { authenticateToken, requireAdmin } from "../middleware/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { planification } from "../utils/erreursPlanning.js";
import { usageCsv, usageDuMois } from "../services/statistiques/usage.js";

const router = express.Router();

// Toutes les statistiques : administration, sur l'année universitaire en cours par défaut
// (?id_annee, ?portee=tout ou ?date_debut&date_fin pour un autre périmètre)
router.use(authenticateToken, requireAdmin, asyncHandler(perimetreStatistiques));

// GET /api/statistiques/salles/occupation - Taux d'occupation global
router.get(
    "/salles/occupation",
    authenticateToken,
    requireAdmin,
    asyncHandler(getOccupationSalles),
);

// GET /api/statistiques/salles/:id/occupation - Occupation d'une salle
router.get(
    "/salles/:id/occupation",
    authenticateToken,
    requireAdmin,
    asyncHandler(getOccupationSalle),
);

// GET /api/statistiques/salles/frequence - Fréquence d'utilisation
router.get(
    "/salles/frequence",
    authenticateToken,
    requireAdmin,
    asyncHandler(getFrequenceSalles),
);

// 📊 GET /api/statistiques/activite/heures-creuses - Heures creuses
router.get(
    "/activite/heures-creuses",
    authenticateToken,
    requireAdmin,
    asyncHandler(getHeuresCreuses),
);

// 📊 GET /api/statistiques/activite/pics - Pics d'activité
router.get(
    "/activite/pics",
    authenticateToken,
    requireAdmin,
    asyncHandler(getPicsActivite),
);

// 📊 GET /api/statistiques/enseignants/charge - Charge de travail
router.get(
    "/enseignants/charge",
    authenticateToken,
    requireAdmin,
    asyncHandler(getChargeEnseignants),
);

// 📊 GET /api/statistiques/groupes/occupation - Occupation par groupe
router.get(
    "/groupes/occupation",
    authenticateToken,
    requireAdmin,
    asyncHandler(getOccupationGroupes),
);

// 📊 GET /api/statistiques/dashboard - Tableau de bord complet
router.get(
    "/dashboard",
    authenticateToken,
    requireAdmin,
    asyncHandler(getDashboard),
);

// 📊 GET /api/statistiques/kpis - KPIs consolidés (occupation salles, heures enseignant/étudiant, créneaux, conflits, durée, filières)
router.get("/kpis", authenticateToken, requireAdmin, asyncHandler(getKPIs));

// 📊 GET /api/statistiques/usage?mois=AAAA-MM - Compteurs d'usage du mois (R-12) ; .csv pour l'export
router.get("/usage", planification(async (req, res) => res.json(await usageDuMois({ mois: req.query.mois }))));
router.get("/usage.csv", planification(async (req, res) => {
    const csv = await usageCsv({ mois: req.query.mois });
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="usage-${req.query.mois}.csv"`);
    res.send(csv);
}));

export default router;
