import jwt from "jsonwebtoken";
import { AuthSession, Users } from "../models/index.js";
import { ACCESS_COOKIE } from "../config/authCookies.js";

// Validation critique au démarrage : JWT_SECRET doit être défini explicitement.
// Un secret par défaut ("secret_key_default") serait devinable et compromettrait tous les tokens.
if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === "production") {
        console.error("ERREUR CRITIQUE: JWT_SECRET n'est pas défini. Arrêt du serveur.");
        process.exit(1);
    } else {
        console.warn("AVERTISSEMENT: JWT_SECRET non défini. Utilisation d'un secret temporaire (dev uniquement).");
    }
}

const JWT_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "dev_secret_temporaire_non_securise";
const JWT_ISSUER = process.env.JWT_ISSUER || "hestim-planner-api";
const JWT_AUDIENCE = process.env.JWT_AUDIENCE || "hestim-planner-spa";

const extractToken = (req) => {
    if (req.cookies?.[ACCESS_COOKIE]) {
        return req.cookies[ACCESS_COOKIE];
    }

    const authHeader = req.headers.authorization;
    return authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
};

const verifyAccessToken = (token) => jwt.verify(token, JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    algorithms: ["HS256"],
});

const attachUserFromToken = async (req, decoded) => {
    const userId = decoded.sub || decoded.userId || decoded.id_user;
    if (!userId) {
        return { status: 401, message: "Token invalide", error: "Le token ne contient pas d'identifiant utilisateur" };
    }

    if (decoded.sid) {
        const session = await AuthSession.findOne({
            where: {
                session_id: decoded.sid,
                id_user: Number(userId),
                revoked_at: null,
            },
        });

        if (!session || new Date(session.expires_at) <= new Date()) {
            return { status: 401, message: "Session invalide", error: "Votre session a expire", code: "SESSION_INVALID" };
        }

        req.auth = {
            userId: Number(userId),
            role: decoded.role,
            sessionId: decoded.sid,
            familyId: decoded.fid,
            jti: decoded.jti,
        };
    }

    const user = await Users.findByPk(userId);

    if (!user) {
        return { status: 401, message: "Utilisateur non trouvé", error: "Token invalide - utilisateur introuvable" };
    }

    if (!user.actif) {
        return { status: 403, message: "Compte désactivé", error: "Votre compte a été désactivé" };
    }

    req.user = user;
    req.userId = user.id_user;
    if (!req.auth) {
        req.auth = {
            userId: user.id_user,
            role: user.role,
            sessionId: decoded.sid || null,
            jti: decoded.jti || null,
        };
    }

    return null;
};

/**
 * Middleware d'authentification JWT
 * Vérifie la présence et la validité du token JWT
 */
export const authenticateToken = async (req, res, next) => {
    try {
        const token = extractToken(req);

        if (!token) {
            return res.status(401).json({
                message: "Token d'authentification manquant",
                error: "Vous devez être connecté pour accéder à cette ressource",
            });
        }

        // Vérifier et décoder le token
        let decoded;
        try {
            decoded = verifyAccessToken(token);
        } catch (jwtError) {
            if (jwtError.name === "JsonWebTokenError") {
                return res.status(401).json({
                    message: "Token invalide",
                    error: "Le token fourni n'est pas valide",
                });
            }
            if (jwtError.name === "TokenExpiredError") {
                return res.status(401).json({
                    message: "Token expiré",
                    error: "Votre session a expiré, veuillez vous reconnecter",
                    code: "TOKEN_EXPIRED",
                });
            }
            throw jwtError;
        }

        const attachError = await attachUserFromToken(req, decoded);
        if (attachError) {
            return res.status(attachError.status).json(attachError);
        }

        next();
    } catch (error) {
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({
                message: "Token invalide",
                error: "Le token fourni n'est pas valide",
            });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token expiré",
                error: "Votre session a expiré, veuillez vous reconnecter",
                code: "TOKEN_EXPIRED",
            });
        }
        return res.status(500).json({
            message: "Erreur d'authentification",
            error: error.message,
        });
    }
};

/**
 * Middleware d'authentification optionnelle
 * Ajoute l'utilisateur à la requête si un token est présent, mais ne bloque pas la requête
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const token = extractToken(req);

        if (token) {
            const decoded = verifyAccessToken(token);
            await attachUserFromToken(req, decoded);
        }
        next();
    } catch (error) {
        // En cas d'erreur, on continue sans authentification
        next();
    }
};
