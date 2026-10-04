import express from "express";
import {
    getAllAffectations,
    getAffectationById,
    createAffectation,
    updateAffectation,
    deleteAffectation,
    verifierAffectation,
    confirmerAffectation,
    getAffectationsByEnseignant,
    getAffectationsByGroupe,
} from "../controllers/index.js";
import {
    authenticateToken,
    requireAdmin,
    requireOwnResourceOrAdmin,
    asyncHandler,
    validateAffectationCreation,
    validateAffectationUpdate,
} from "../middleware/index.js";
import { requireGroupAccess } from "../middleware/accessMiddleware.js";

const router = express.Router();

router.use(authenticateToken);

// 🔍 Récupérer toutes les affectations (Admin — vue de planification globale)
router.get("/", requireAdmin, asyncHandler(getAllAffectations));

// 🔍 Récupérer les affectations par enseignant (Enseignant propriétaire ou Admin)
router.get(
    "/enseignant/:id_enseignant",
    requireOwnResourceOrAdmin("id_enseignant"),
    asyncHandler(getAffectationsByEnseignant)
);

// 🔍 Récupérer les affectations par groupe (personnel, ou étudiant membre du groupe)
router.get("/groupe/:id_groupe", requireGroupAccess("id_groupe"), asyncHandler(getAffectationsByGroupe));

// 🧪 Vérifier une séance sans l'enregistrer (Admin) : règles enfreintes, bloquantes ou non
router.post("/verifier", requireAdmin, validateAffectationCreation, asyncHandler(verifierAffectation));

// 🔍 Récupérer une affectation par ID (accès vérifié dans le contrôleur)
router.get("/:id", asyncHandler(getAffectationById));

// ➕ Créer une affectation (Admin seulement)
router.post(
    "/",
    requireAdmin,
    validateAffectationCreation,
    asyncHandler(createAffectation)
);

// ✏️ Mettre à jour une affectation (Admin seulement)
router.put("/:id", requireAdmin, validateAffectationUpdate, asyncHandler(updateAffectation));

// 🗑️ Supprimer une affectation (Admin seulement)
router.delete("/:id", requireAdmin, asyncHandler(deleteAffectation));

// ✅ Confirmer une affectation (Enseignant propriétaire ou Admin, vérifié dans le contrôleur)
router.patch("/:id/confirmer", asyncHandler(confirmerAffectation));

export default router;
