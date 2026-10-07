import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

/**
 * Adresse journalisée sans ses secrets : le jeton de l'agenda ICS (/api/agenda/<jeton>.ics, qui
 * suffit à lire l'emploi du temps d'un compte), le code à usage unique de la passerelle web et
 * les jetons de réinitialisation ou de vérification passés en paramètre.
 */
export const urlMasquee = (url = "") =>
    String(url)
        .replace(/(\/api\/agenda\/)[^/?#]+(\.ics)/i, "$1***$2")
        .replace(/([?&](?:code|token|jeton|c)=)[^&#]*/gi, "$1***");

// Remplace le jeton « :url » de morgan pour tous les formats
morgan.token("url", (req) => urlMasquee(req.originalUrl || req.url));

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
        url: urlMasquee(req.originalUrl),
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
