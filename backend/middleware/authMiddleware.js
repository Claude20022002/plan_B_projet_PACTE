import { AuthSession, Users } from "../models/index.js";
import { ACCESS_COOKIE } from "../config/authCookies.js";
import { verifierJetonAcces } from "../utils/jetons.js";

// Les jetons d'accès sont signés en RS256 (utils/jetons.js) ; le seul secret partagé restant
// signe les jetons CSRF. Sans lui, en production, un défaut devinable serait utilisé : arrêt.
if (!process.env.CSRF_SECRET && !process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === "production") {
        console.error("ERREUR CRITIQUE: CSRF_SECRET n'est pas défini. Arrêt du serveur.");
        process.exit(1);
    } else {
        console.warn("AVERTISSEMENT: CSRF_SECRET non défini. Utilisation d'un secret temporaire (dev uniquement).");
    }
}

const extractToken = (req) => {
    if (req.cookies?.[ACCESS_COOKIE]) {
        return req.cookies[ACCESS_COOKIE];
    }

    const authHeader = req.headers.authorization;
    return authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
};

const verifyAccessToken = (token) => verifierJetonAcces(token);

const attachUserFromToken = async (req, decoded) => {
    const userId = decoded.sub || decoded.userId || decoded.id_user;
    if (!userId) {
        return { status: 401, message: "Token invalide", error: "Le token ne contient pas d'identifiant utilisateur" };
    }

    // Tout jeton doit être rattaché à une session serveur : c'est ce qui rend
    // effectifs la déconnexion, la révocation d'appareil et la réinitialisation de mot de passe.
    if (!decoded.sid) {
        return { status: 401, message: "Token invalide", error: "Session absente du token", code: "SESSION_INVALID" };
    }

    // Session et utilisateur en une lecture (chaque requête authentifiée passe ici) ; la portée
    // par défaut de Users s'applique aussi dans l'include (ni mot de passe ni secret TOTP)
    const session = await AuthSession.findOne({
        where: {
            session_id: decoded.sid,
            id_user: Number(userId),
            revoked_at: null,
        },
        include: [{ model: Users, as: "user", required: false }],
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

    const { user } = session;

    if (!user) {
        return { status: 401, message: "Utilisateur non trouvé", error: "Token invalide - utilisateur introuvable" };
    }

    if (!user.actif) {
        return { status: 403, message: "Compte désactivé", error: "Votre compte a été désactivé" };
    }

    req.user = user;
    req.userId = user.id_user;

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
            // Le cookie d'accès disparaît du navigateur à son expiration : le client peut alors
            // tenter un renouvellement avec son cookie de session (code TOKEN_MISSING)
            return res.status(401).json({
                message: "Token d'authentification manquant",
                error: "Vous devez être connecté pour accéder à cette ressource",
                code: "TOKEN_MISSING",
            });
        }

        // Déjà vérifié par optionalAuth pour ce même jeton (session et utilisateur chargés) :
        // pas de seconde lecture en base dans la même requête
        if (req.user && req.jetonVerifie === token) {
            return next();
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
                    // Ex. jeton signé avant le passage en RS256 : le client tente un renouvellement
                    code: "TOKEN_INVALID",
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
                code: "TOKEN_INVALID",
            });
        }
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                message: "Token expiré",
                error: "Votre session a expiré, veuillez vous reconnecter",
                code: "TOKEN_EXPIRED",
            });
        }
        console.error("Erreur d'authentification:", error);
        return res.status(500).json({
            message: "Erreur d'authentification",
            error: "Une erreur interne est survenue",
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
            const erreur = await attachUserFromToken(req, decoded);
            // Session et utilisateur valides : authenticateToken n'aura pas à les relire
            if (!erreur) req.jetonVerifie = token;
        }
        next();
    } catch (error) {
        // En cas d'erreur, on continue sans authentification
        next();
    }
};
