import express from "express";
import { exigerJetonIntegration, jwks, referentiel } from "../controllers/integrationController.js";

/**
 * Routes d'intégration (phase C) : montées sur /api.
 *   GET /api/.well-known/jwks.json      public — clés de vérification des jetons
 *   GET /api/integration/referentiel    jeton de service — filières et modules pour StudyLib
 */
const router = express.Router();

router.get("/.well-known/jwks.json", jwks);
router.get("/integration/referentiel", exigerJetonIntegration, referentiel);

export default router;
