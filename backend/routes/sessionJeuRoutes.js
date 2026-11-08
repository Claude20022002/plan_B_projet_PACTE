import express from "express";
import { authenticateToken } from "../middleware/index.js";
import { createRateLimiter } from "../middleware/rateLimiterMiddleware.js";
import { planification } from "../utils/erreursPlanning.js";
import { changerDefi, ecarterProposition, jouerCommande, lancerSession, sessionsOuvertes, suiviSession, terminerSession } from "../services/jeux/sessions.js";
import { proposer, rejoindreSession, vueEtudiant } from "../services/jeux/sessionsEtudiant.js";

/**
 * Sessions de jeu lancées en classe (services/jeux/sessions.js).
 * Enseignant :
 *  - POST   /api/sessions-jeu                         { code_jeu, id_cours, mode } : lancer (QR code et code)
 *  - GET    /api/sessions-jeu                         mes sessions ouvertes
 *  - GET    /api/sessions-jeu/:id                     participants et, en collectif, réponses en attente
 *  - POST   /api/sessions-jeu/:id/terminer
 *  - PUT    /api/sessions-jeu/:id/defi                { id_defi } : collectif, défi projeté (terminal remis à zéro)
 *  - POST   /api/sessions-jeu/:id/commandes           { id_proposition } ou { texte } : collectif, jouer au tableau
 *  - DELETE /api/sessions-jeu/:id/propositions/:idp   écarter une réponse
 * Étudiant :
 *  - POST   /api/sessions-jeu/rejoindre               { code }
 *  - GET    /api/sessions-jeu/:id/tableau             le tableau et ma réponse
 *  - POST   /api/sessions-jeu/:id/propositions        { texte } : ma réponse (remplace la précédente)
 *
 * Le limiteur global de l'API laisse passer ces routes (app.js) : chaque téléphone relit le
 * tableau toutes les quelques secondes, ce qui épuiserait la limite générale du compte. Elles
 * ont leur propre limite, par compte.
 */
const router = express.Router();
router.use(authenticateToken);

// Relire le tableau toutes les 3 s pendant 15 min : 300 requêtes ; la limite laisse de la marge
router.use(
    createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 900,
        keyGenerator: (req) => (req.user ? `user:${req.user.id_user}` : null),
        message: "Trop de requêtes, veuillez réessayer plus tard.",
    })
);

// Un code se devine en essayant : 20 essais par quart d'heure et par compte
const limiteCodes = createRateLimiter({
    nom: "session-jeu-code",
    persistant: true,
    windowMs: 15 * 60 * 1000,
    max: 20,
    keyGenerator: (req) => (req.user ? `user:${req.user.id_user}` : null),
    message: "Trop de codes essayés : réessayez dans quelques minutes.",
});

const route = (fn, statut = 200) => planification(async (req, res) => res.status(statut).json(await fn(req)));

router.post("/", route((req) => lancerSession(req.user, req.body ?? {}), 201));
router.get("/", route(async (req) => ({ data: await sessionsOuvertes(req.user) })));
router.post("/rejoindre", limiteCodes, route((req) => rejoindreSession(req.user, req.body?.code)));
router.get("/:id", route((req) => suiviSession(req.user, req.params.id)));
router.post("/:id/terminer", route((req) => terminerSession(req.user, req.params.id)));
router.put("/:id/defi", route((req) => changerDefi(req.user, req.params.id, req.body?.id_defi)));
router.post("/:id/commandes", route((req) => jouerCommande(req.user, req.params.id, req.body ?? {})));
router.delete("/:id/propositions/:idp", route((req) => ecarterProposition(req.user, req.params.id, req.params.idp)));
router.get("/:id/tableau", route((req) => vueEtudiant(req.user, req.params.id)));
router.post("/:id/propositions", route((req) => proposer(req.user, req.params.id, req.body?.texte), 201));

export default router;
