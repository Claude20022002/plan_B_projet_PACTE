import express from "express";
import {
    login,
    logout,
    logoutAllDevices,
    listSessions,
    revokeSession,
    getMe,
    refreshToken,
    forgotPassword,
    resetPassword,
    changePassword,
    creerPasserelle,
    suivrePasserelle,
    verifierMfa,
} from "../controllers/authController.js";
import { Users } from "../models/index.js";
import { comparePassword } from "../utils/passwordHelper.js";
import { planification } from "../utils/erreursPlanning.js";
import { confirmerInscription, demarrerInscription, desactiver, etatMfa, regenererCodesSecours } from "../services/mfa.js";
import { authenticateToken, optionalAuth } from "../middleware/authMiddleware.js";
import { issueCsrfToken } from "../middleware/csrfMiddleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authRateLimiter, loginCompteRateLimiter, loginIpRateLimiter } from "../middleware/rateLimiterMiddleware.js";

const router = express.Router();

// Pas de route d'inscription publique : les comptes sont créés par l'administration.

// 🔐 GET /api/auth/csrf-token - Jeton CSRF SPA
router.get("/csrf-token", issueCsrfToken);

// 🔐 POST /api/auth/login - Connexion
router.post("/login", loginIpRateLimiter, loginCompteRateLimiter, asyncHandler(login));

// ── Double authentification (services/mfa.js) ──
// Second temps de la connexion : { defi, code } (échecs comptés par adresse, 5 essais par défi)
router.post("/mfa/verifier", loginIpRateLimiter, asyncHandler(verifierMfa));
// État (active, obligatoire, codes de secours restants)
router.get("/mfa", authenticateToken, planification(async (req, res) => res.json(await etatMfa(req.user))));
// Inscription : secret et adresse du QR code, puis confirmation par un premier code → codes de secours
router.post("/mfa/inscription", authRateLimiter, authenticateToken, planification(async (req, res) => res.json(await demarrerInscription(req.user))));
router.post("/mfa/confirmation", authRateLimiter, authenticateToken, planification(async (req, res) => res.json(await confirmerInscription(req.user, req.body?.code))));
router.post("/mfa/codes-secours", authRateLimiter, authenticateToken, planification(async (req, res) => res.json(await regenererCodesSecours(req.user, req.body?.code))));
// Désactivation (enseignant seulement) : mot de passe et code
router.post(
    "/mfa/desactivation",
    authRateLimiter,
    authenticateToken,
    planification(async (req, res) => {
        const avecHash = await Users.scope("withPassword").findByPk(req.user.id_user);
        if (typeof req.body?.password !== "string" || !(await comparePassword(req.body.password, avecHash.password_hash))) {
            return res.status(400).json({ message: "Mot de passe incorrect", error: "Mot de passe incorrect" });
        }
        return res.json(await desactiver(req.user, req.body?.code));
    })
);

// 🔐 POST /api/auth/logout - Déconnexion
router.post("/logout", optionalAuth, asyncHandler(logout));

// 🔐 POST /api/auth/logout-all - Déconnexion de tous les appareils
router.post("/logout-all", authenticateToken, asyncHandler(logoutAllDevices));

// 🔐 GET /api/auth/me - Profil utilisateur connecté
router.get("/me", authenticateToken, asyncHandler(getMe));

// Changer son mot de passe (obligatoire après une invitation ou un mot de passe provisoire)
router.post("/change-password", authRateLimiter, authenticateToken, asyncHandler(changePassword));

// 🔐 POST /api/auth/refresh - Rafraîchir le token
router.post("/refresh", asyncHandler(refreshToken));

// 🔐 GET /api/auth/sessions - Sessions actives
router.get("/sessions", authenticateToken, asyncHandler(listSessions));

// 🔐 DELETE /api/auth/sessions/:sessionId - Révoquer un appareil
router.delete("/sessions/:sessionId", authenticateToken, asyncHandler(revokeSession));

// Passerelle de l'application mobile vers les sites web : code à usage unique, puis session web.
// Pas de limiteur des connexions : tout un campus partage la même adresse, et le code (256 bits)
// ne se devine pas.
router.post("/passerelle", authenticateToken, asyncHandler(creerPasserelle));
router.get("/passerelle", asyncHandler(suivrePasserelle));

// 🔐 POST /api/auth/forgot-password - Demande de réinitialisation
router.post("/forgot-password", authRateLimiter, asyncHandler(forgotPassword));

// 🔐 POST /api/auth/reset-password - Réinitialisation avec token
router.post("/reset-password", authRateLimiter, asyncHandler(resetPassword));

export default router;

