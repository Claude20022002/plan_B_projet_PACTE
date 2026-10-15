import express from "express";
import { authenticateToken } from "../middleware/index.js";
import { createRateLimiter } from "../middleware/rateLimiterMiddleware.js";
import { planification } from "../utils/erreursPlanning.js";
import { diffuserMedia } from "../services/studio/medias.js";
import { commencer, enregistrerReponse, mediaDeTentative, mesTentatives, rejoindre, rendre, vueTentative } from "../services/studio/tentatives.js";

/**
 * Passer un quiz du Studio (étudiant ; l'enseignant pour l'aperçu de ses propres quiz).
 *  - POST /api/passations/rejoindre { code }              accueil du quiz : consignes, temps, tentatives
 *  - GET  /api/passations/mes-tentatives                  historique
 *  - POST /api/passations/sessions/:id/tentatives         commence (ou reprend) une tentative
 *  - GET  /api/passations/tentatives/:id                  la copie (questions sans les réponses justes)
 *  - PUT  /api/passations/tentatives/:id/reponses/:idq    { reponse?, marquee?, valider? } enregistrement immédiat
 *  - POST /api/passations/tentatives/:id/rendre           rend la copie → résultat selon le mode de correction
 *  - GET  /api/passations/tentatives/:id/medias/:idMedia  image, audio ou vidéo d'une question (Range accepté)
 */
const router = express.Router();
router.use(authenticateToken);

// Un code se devine en essayant : 20 essais par quart d'heure et par compte
const limiteCodes = createRateLimiter({
    nom: "passation-code",
    persistant: true,
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => (req.user ? `user:${req.user.id_user}` : null),
    message: "Trop de codes essayés : réessayez dans quelques minutes.",
});

const route = (fn, statut = 200) => planification(async (req, res) => res.status(statut).json(await fn(req)));

router.post("/rejoindre", limiteCodes, route((req) => rejoindre(req.user, req.body?.code)));
router.get("/mes-tentatives", route((req) => mesTentatives(req.user)));
router.post("/sessions/:id/tentatives", route((req) => commencer(req.user, req.params.id), 201));
router.get("/tentatives/:id", route((req) => vueTentative(req.user, req.params.id)));
router.put("/tentatives/:id/reponses/:idq", route((req) => enregistrerReponse(req.user, req.params.id, req.params.idq, req.body ?? {})));
router.post("/tentatives/:id/rendre", route((req) => rendre(req.user, req.params.id)));
router.get("/tentatives/:id/medias/:idMedia", planification(async (req, res) => diffuserMedia(req, res, await mediaDeTentative(req.user, req.params.id, req.params.idMedia))));

export default router;
