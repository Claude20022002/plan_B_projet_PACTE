import jwt from "jsonwebtoken";
import { Users } from "../models/index.js";

/**
 * Middleware d'authentification JWT
 * Vérifie la présence et la validité du token JWT
 */
export const authenticateToken = async (req, res, next) => {
    try {
        // Récupérer le token depuis l'en-tête Authorization
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

        if (!token) {
            return res.status(401).json({
                message: "Token d'authentification manquant",
                error: "Vous devez être connecté pour accéder à cette ressource",
            });
        }

        // Vérifier et décoder le token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "secret_key_default"
        );

        // Récupérer l'utilisateur depuis la base de données
        const user = await Users.findByPk(decoded.userId || decoded.id_user);

        if (!user) {
            return res.status(401).json({
                message: "Utilisateur non trouvé",
                error: "Token invalide - utilisateur introuvable",
            });
        }

        // Vérifier que l'utilisateur est actif
        if (!user.actif) {
            return res.status(403).json({
                message: "Compte désactivé",
                error: "Votre compte a été désactivé",
            });
        }

        // Ajouter l'utilisateur à la requête pour utilisation dans les routes
        req.user = user;
        req.userId = user.id_user;

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
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];

        if (token) {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || "secret_key_default"
            );
            const user = await Users.findByPk(
                decoded.userId || decoded.id_user
            );

            if (user && user.actif) {
                req.user = user;
                req.userId = user.id_user;
            }
        }
        next();
    } catch (error) {
        // En cas d'erreur, on continue sans authentification
        next();
    }
};
