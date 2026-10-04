/**
 * Compte créé par l'administration (ou mot de passe réinitialisé par elle) : tant que
 * l'utilisateur n'a pas choisi son mot de passe, seules les routes de session et le
 * changement de mot de passe répondent ; le reste renvoie 403 PASSWORD_CHANGE_REQUIRED.
 */
const ROUTES_AUTORISEES = new Set([
    "GET /api/auth/me",
    "GET /api/auth/csrf-token",
    "POST /api/auth/logout",
    "POST /api/auth/logout-all",
    "POST /api/auth/refresh",
    "POST /api/auth/change-password",
]);

export const exigerChangementMotDePasse = (req, res, next) => {
    if (!req.user?.must_change_password) return next();
    const route = `${req.method} ${req.originalUrl.split("?")[0].replace(/\/$/, "")}`;
    if (ROUTES_AUTORISEES.has(route)) return next();
    return res.status(403).json({
        message: "Changement de mot de passe requis",
        error: "Choisissez votre mot de passe avant de continuer",
        code: "PASSWORD_CHANGE_REQUIRED",
    });
};
