import express from "express";
import {
    getEnseignements,
    genererDepuisMaquette,
    fusionner,
    scinder,
    updateEnseignement,
    deleteEnseignement,
    ajouterEnseignant,
    getCandidats,
    modifierService,
    retirerEnseignant,
} from "../controllers/index.js";
import {
    authenticateToken,
    asyncHandler,
    validateGenerationEnseignements,
    validateFusionEnseignements,
    validateEnseignementUpdate,
    validateService,
} from "../middleware/index.js";
import { autoriserFiliere, filiereDuCorps, requireAdminOuResponsable } from "../services/planning/droits.js";
import { filiereDeLEnseignement, filieresDeLaFusion } from "../services/planning/resolveursFiliere.js";

const router = express.Router();

// Enseignements (composante × groupes) : administration, et responsables pour leurs filières
router.use(authenticateToken, requireAdminOuResponsable);

const surSaFiliere = autoriserFiliere(filiereDeLEnseignement);

router.get("/", asyncHandler(getEnseignements));
// Sans filière précisée, la génération porte sur toute l'école : administration seulement
router.post("/generer", validateGenerationEnseignements, autoriserFiliere(filiereDuCorps), asyncHandler(genererDepuisMaquette));
router.post("/fusionner", validateFusionEnseignements, autoriserFiliere(filieresDeLaFusion), asyncHandler(fusionner));
router.post("/:id/scinder", surSaFiliere, asyncHandler(scinder));
router.put("/:id", validateEnseignementUpdate, surSaFiliere, asyncHandler(updateEnseignement));
router.delete("/:id", surSaFiliere, asyncHandler(deleteEnseignement));

// Services : enseignants proposés sur l'enseignement (principal ou co-enseignant)
router.get("/:id/candidats", surSaFiliere, asyncHandler(getCandidats));
router.post("/:id/enseignants", validateService(true), surSaFiliere, asyncHandler(ajouterEnseignant));
router.put("/:id/enseignants/:idUser", validateService(false), surSaFiliere, asyncHandler(modifierService));
router.delete("/:id/enseignants/:idUser", surSaFiliere, asyncHandler(retirerEnseignant));

export default router;
