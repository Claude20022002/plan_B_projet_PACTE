import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

/**
 * Configuration du logger Morgan
 * Format différent selon l'environnement
 */

// Format pour le développement (plus détaillé)
const devFormat =
    ":method :url :status :response-time ms - :res[content-length]";

// Format pour la production (plus concis)
const prodFormat =
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length]';

/**
 * Middleware de logging avec Morgan
 */
export const logger = morgan(
    process.env.NODE_ENV === "production" ? prodFormat : devFormat,
    {
        // Options de streaming (peut être personnalisé pour écrire dans un fichier)
        stream: process.stdout,
    }
);

/**
 * Logger personnalisé pour les erreurs
 */
export const errorLogger = (err, req, res, next) => {
    console.error("❌ Erreur:", {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        user: req.user ? req.user.id_user : "non authentifié",
        error: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
    next(err);
};

/**
 * Logger pour les requêtes importantes
 */
export const requestLogger = (req, res, next) => {
    if (process.env.NODE_ENV === "development") {
        console.log(`📥 ${req.method} ${req.originalUrl}`, {
            body: req.body,
            params: req.params,
            query: req.query,
        });
    }
    next();
};
