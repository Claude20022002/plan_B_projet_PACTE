import { ACCESS_COOKIE, CSRF_COOKIE, REFRESH_COOKIE, setCsrfCookie, verifyCsrfToken } from "../config/authCookies.js";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Routes appelées avant qu'une session (et donc un jeton CSRF lié à la session) n'existe.
const csrfExemptPaths = new Set([
    "/api/auth/csrf-token",
    "/api/auth/refresh",
    "/api/auth/login",
    "/api/auth/mfa/verifier",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
]);

const getAllowedOrigins = () =>
    process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").map((item) => item.trim())
        : ["http://localhost:5173", "http://localhost:3000"];

export const issueCsrfToken = (req, res) => {
    const token = setCsrfCookie(res, req.auth?.sessionId || "anonymous");
    res.json({ csrfToken: token });
};

/**
 * Protection CSRF « double submit » : le jeton signé du cookie doit être renvoyé
 * dans l'en-tête X-CSRF-Token, et il doit être lié à la session courante.
 * Un site tiers peut faire envoyer le cookie, mais ne peut pas le lire pour remplir l'en-tête.
 */
export const csrfProtection = (req, res, next) => {
    const path = req.originalUrl.split("?")[0];
    if (!unsafeMethods.has(req.method) || csrfExemptPaths.has(path)) {
        return next();
    }

    // Client authentifié par l'en-tête Authorization (application mobile) et sans cookie
    // d'authentification : un site tiers ne peut ni poser cet en-tête (CORS) ni s'appuyer sur un
    // cookie envoyé d'office, le CSRF ne le concerne pas. Dès qu'un cookie d'auth est présent,
    // la protection s'applique normalement.
    const bearer = req.get("authorization")?.startsWith("Bearer ");
    if (bearer && !req.cookies?.[ACCESS_COOKIE] && !req.cookies?.[REFRESH_COOKIE]) {
        return next();
    }

    const origin = req.get("origin");
    if (origin && !getAllowedOrigins().includes(origin)) {
        return res.status(403).json({
            message: "Origine non autorisee",
            code: "CSRF_ORIGIN_INVALID",
        });
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE];
    const headerToken = req.get("X-CSRF-Token");
    const sessionId = req.auth?.sessionId || null;

    if (!cookieToken || !headerToken || cookieToken !== headerToken || !verifyCsrfToken(headerToken, sessionId)) {
        return res.status(403).json({
            message: "CSRF token invalide",
            code: "CSRF_INVALID",
        });
    }

    next();
};
