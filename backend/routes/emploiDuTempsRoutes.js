import express from "express";
import {
    getEmploiDuTempsEnseignant,
    getEmploiDuTempsGroupe,
    getEmploiDuTempsEtudiant,
    getEmploiDuTempsSalle,
    getEmploiDuTempsConsolide,
    genererEmploiDuTemps,
} from "../controllers/emploiDuTempsController.js";
import { authenticateToken, requireAdmin } from "../middleware/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

// 📅 GET /api/emplois-du-temps/enseignant/:id - Emploi du temps d'un enseignant
router.get(
    "/enseignant/:id",
    authenticateToken,
    asyncHandler(getEmploiDuTempsEnseignant)
);

// 📅 GET /api/emplois-du-temps/groupe/:id - Emploi du temps d'un groupe
router.get(
    "/groupe/:id",
    authenticateToken,
    asyncHandler(getEmploiDuTempsGroupe)
);

// 📅 GET /api/emplois-du-temps/etudiant/:id - Emploi du temps d'un étudiant
router.get(
    "/etudiant/:id",
    authenticateToken,
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

