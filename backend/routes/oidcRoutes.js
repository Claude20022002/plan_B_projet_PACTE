import express from "express";
import { parseCookies } from "../middleware/cookieMiddleware.js";
import { optionalAuth } from "../middleware/authMiddleware.js";
import { fournisseur, idCompte, MONTAGE, ROLES_AUTORISES } from "../services/oidc/provider.js";

/**
 * Fournisseur OpenID Connect sous /api/oidc (phase Q, connexion des enseignants à ClassQuiz).
 * Monté avant les lecteurs de corps d'Express : oidc-provider lit lui-même ceux de /token.
 *
 * Interaction : pas d'écran à part. Un enseignant déjà connecté à Planner est connecté au
 * client d'office (client de la plateforme, consentement implicite) ; sinon il passe par la
 * page de connexion de Planner, qui le ramène ici ; un étudiant est refusé (access_denied).
 */
const router = express.Router();
const SCOPES = ["openid", "email", "profile"];

router.use((req, res, next) => {
    if (!fournisseur()) return res.status(404).json({ message: "Fournisseur OpenID Connect désactivé" });
    next();
});

router.get("/interaction/:uid", parseCookies, optionalAuth, async (req, res, next) => {
    const provider = fournisseur();
    try {
        const details = await provider.interactionDetails(req, res);
        if (details.uid !== req.params.uid) return res.status(400).json({ message: "Interaction inconnue" });

        if (!req.user) {
            return res.redirect(303, `/connexion?next=${encodeURIComponent(`${MONTAGE}/interaction/${details.uid}`)}`);
        }
        if (!ROLES_AUTORISES.includes(req.user.role)) {
            return await provider.interactionFinished(req, res, {
                error: "access_denied",
                error_description: "ClassQuiz est réservé aux enseignants : les étudiants rejoignent les parties par code PIN.",
            }, { mergeWithLastSubmission: false });
        }

        const accountId = idCompte(req.user.id_user);
        const clientId = details.params.client_id;
        let grant = details.grantId ? await provider.Grant.find(details.grantId) : null;
        if (!grant || grant.accountId !== accountId || grant.clientId !== clientId) {
            grant = new provider.Grant({ accountId, clientId });
        }
        const demandes = String(details.params.scope ?? "").split(" ").filter((s) => SCOPES.includes(s));
        grant.addOIDCScope(demandes.join(" "));
        const grantId = await grant.save();

        await provider.interactionFinished(req, res, { login: { accountId }, consent: { grantId } }, { mergeWithLastSubmission: false });
    } catch (erreur) {
        // Cookie d'interaction absent ou expiré (lien rejoué, plus de 10 minutes)
        if (erreur?.name === "SessionNotFound") {
            return res.status(400).json({ message: "Connexion expirée : relancez-la depuis ClassQuiz." });
        }
        next(erreur);
    }
});

// Tout le reste (découverte, authorize, token, userinfo, jwks, fin de session) : oidc-provider
router.use((req, res) => fournisseur().callback()(req, res));

export default router;
