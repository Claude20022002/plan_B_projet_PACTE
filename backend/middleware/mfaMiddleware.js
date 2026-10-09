import { mfaAConfigurer } from "../services/mfa.js";

/**
 * Administrateur sans double authentification : tant qu'il ne l'a pas configurée, seules les
 * routes de session et de configuration répondent ; le reste renvoie 403 MFA_SETUP_REQUIRED
 * (le site le conduit à la page « Sécurité »).
 */
const ROUTES_AUTORISEES = new Set([
    "GET /api/auth/me",
    "GET /api/auth/csrf-token",
    "POST /api/auth/logout",
    "POST /api/auth/logout-all",
    "POST /api/auth/refresh",
    "POST /api/auth/change-password",
    "GET /api/auth/mfa",
    "POST /api/auth/mfa/inscription",
    "POST /api/auth/mfa/confirmation",
]);

export const exigerDoubleAuthentification = (req, res, next) => {
    if (!req.user || !mfaAConfigurer(req.user)) return next();
    const route = `${req.method} ${req.originalUrl.split("?")[0].replace(/\/$/, "")}`;
    if (ROUTES_AUTORISEES.has(route)) return next();
    return res.status(403).json({
        message: "Double authentification requise",
        error: "Configurez la double authentification avant de continuer",
        code: "MFA_SETUP_REQUIRED",
    });
};
