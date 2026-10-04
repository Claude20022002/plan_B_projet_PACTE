import express from "express";
import {
    getEmploiDuTempsEnseignant,
    getEmploiDuTempsGroupe,
    getEmploiDuTempsEtudiant,
    getEmploiDuTempsSalle,
    getEmploiDuTempsConsolide,
    genererEmploiDuTemps,
} from "../controllers/emploiDuTempsController.js";
import { authenticateToken, requireAdmin, requireOwnResourceOrAdmin } from "../middleware/index.js";
import { requireGroupAccess, requireSelfOrStaff } from "../middleware/accessMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import { seancesDeLEtudiant } from "../services/planning/monEmploiDuTemps.js";
import { aujourdhui } from "../services/planning/affectationRules.js";
import { planification } from "../utils/erreursPlanning.js";
import { getEdtMensuel } from "../controllers/preparationController.js";

const router = express.Router();

// 📅 GET /api/emplois-du-temps/enseignant/:id - Emploi du temps d'un enseignant (lui-même ou admin)
router.get(
    "/enseignant/:id",
    authenticateToken,
    requireOwnResourceOrAdmin("id"),
    asyncHandler(getEmploiDuTempsEnseignant)
);

// 📅 GET /api/emplois-du-temps/groupe/:id - Emploi du temps d'un groupe (personnel ou membre du groupe)
router.get(
    "/groupe/:id",
    authenticateToken,
    requireGroupAccess("id"),
    asyncHandler(getEmploiDuTempsGroupe)
);

// 📱 GET /api/emplois-du-temps/moi?du=&au= — l'étudiant connecté (application mobile) :
// séances de ses groupes et de leurs parents, mutualisations comprises, annulées visibles
router.get(
    "/moi",
    authenticateToken,
    requireRole("etudiant"),
    planification(async (req, res) => {
        res.json(await seancesDeLEtudiant(req.user.id_user, { du: req.query.du, au: req.query.au, aujourdhui: aujourdhui() }));
    })
);

// 🗓️ GET /api/emplois-du-temps/groupe/:id/mensuel?mois=AAAA-MM - EDT du mois au format HESTIM (impression, PDF)
router.get("/groupe/:id/mensuel", authenticateToken, requireGroupAccess("id"), getEdtMensuel);

// 📅 GET /api/emplois-du-temps/etudiant/:id - Emploi du temps d'un étudiant (lui-même ou personnel)
router.get(
    "/etudiant/:id",
    authenticateToken,
    requireSelfOrStaff("id"),
    asyncHandler(getEmploiDuTempsEtudiant)
);

// 📅 GET /api/emplois-du-temps/salle/:id - Emploi du temps d'une salle
router.get(
    "/salle/:id",
    authenticateToken,
    asyncHandler(getEmploiDuTempsSalle)
);

// 📅 GET /api/emplois-du-temps/consolide - Emploi du temps consolidé
router.get(
    "/consolide",
    authenticateToken,
    requireAdmin,
    asyncHandler(getEmploiDuTempsConsolide)
);

// 🤖 POST /api/emplois-du-temps/generer - Génération automatique
router.post(
    "/generer",
    authenticateToken,
    requireAdmin,
    asyncHandler(genererEmploiDuTemps)
);

export default router;

