import { CSRF_COOKIE, setCsrfCookie, verifyCsrfToken } from "../config/authCookies.js";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const csrfExemptPaths = new Set([
    "/api/auth/csrf-token",
]);

export const issueCsrfToken = (req, res) => {
    const token = setCsrfCookie(res, req.auth?.sessionId || "anonymous");
    res.json({ csrfToken: token });
};

export const csrfProtection = (req, res, next) => {
    if (!unsafeMethods.has(req.method) || csrfExemptPaths.has(req.path) || csrfExemptPaths.has(req.originalUrl)) {
        return next();
    }

    const origin = req.get("origin");
    const allowedOrigins = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").map((item) => item.trim())
        : ["http://localhost:5173", "http://localhost:3000"];

    if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({
            message: "Origine non autorisee",
            code: "CSRF_ORIGIN_INVALID",
        });
    }

    const cookieToken = req.cookies?.[CSRF_COOKIE];
    const headerToken = req.get("X-CSRF-Token");
    const sessionId = req.auth?.sessionId || "anonymous";

    if (!cookieToken || !headerToken || cookieToken !== headerToken || !verifyCsrfToken(headerToken, sessionId)) {
        return res.status(403).json({
            message: "CSRF token invalide",
            code: "CSRF_INVALID",
        });
    }

    next();
};
