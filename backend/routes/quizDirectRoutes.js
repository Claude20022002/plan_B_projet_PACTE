import express from "express";
import { authenticateToken } from "../middleware/index.js";
import { createRateLimiter } from "../middleware/rateLimiterMiddleware.js";
import { planification } from "../utils/erreursPlanning.js";
import { agirDirect, lancerDirect, vueEnseignant } from "../services/studio/direct.js";
import { rejoindreDirect, repondreDirect, vueJoueur } from "../services/studio/directJoueur.js";

/**
 * Quiz en direct du Studio (docs/plans/sortie-classquiz.md, lot SC-1a).
 * Enseignant :
 *  - POST /api/quiz-direct                 { id_questionnaire, titre?, id_groupe?, id_affectation?, duree_question_s? }
 *  - GET  /api/quiz-direct/:id             l'écran à projeter
 *  - POST /api/quiz-direct/:id/suivante    première question, ou la suivante (après la dernière : fin)
 *  - POST /api/quiz-direct/:id/fermer      fermer la question avant la fin du chrono
 *  - POST /api/quiz-direct/:id/classement  montrer le classement après la correction
 *  - POST /api/quiz-direct/:id/terminer
 * Étudiant (le code se saisit dans « Quiz » : POST /api/passations/rejoindre rend mode « direct ») :
 *  - POST /api/quiz-direct/:id/rejoindre
 *  - GET  /api/quiz-direct/:id/joueur?depuis=<version>
 *  - POST /api/quiz-direct/:id/reponses    { index, reponse }
 *
 * Le limiteur global de l'API laisse passer ces routes (app.js) : chaque téléphone relit l'écran
 * toutes les secondes, ce qui épuiserait la limite générale du compte. Elles ont la leur.
 */
const router = express.Router();
router.use(authenticateToken);

// Relire l'écran chaque seconde pendant 15 min : 900 requêtes, plus les réponses ; la limite laisse de la marge
router.use(
    createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 1500,
        keyGenerator: (req) => (req.user ? `user:${req.user.id_user}` : null),
        message: "Trop de requêtes, veuillez réessayer plus tard.",
    })
);

const route = (fn, statut = 200) => planification(async (req, res) => res.status(statut).json(await fn(req)));

router.post("/", route((req) => lancerDirect(req.user, req.body?.id_questionnaire, req.body ?? {}), 201));
router.get("/:id", route((req) => vueEnseignant(req.user, req.params.id)));
for (const action of ["suivante", "fermer", "classement", "terminer"]) {
    router.post(`/:id/${action}`, route((req) => agirDirect(req.user, req.params.id, action)));
}
router.post("/:id/rejoindre", route((req) => rejoindreDirect(req.user, req.params.id)));
router.get("/:id/joueur", route((req) => vueJoueur(req.user, req.params.id, { depuis: req.query.depuis })));
router.post("/:id/reponses", route((req) => repondreDirect(req.user, req.params.id, req.body ?? {})));

export default router;
