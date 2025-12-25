import helmet from "helmet";

/**
 * Middleware de sécurité avec Helmet
 * Configure divers en-têtes HTTP pour sécuriser l'application
 */
export const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false, // Peut être activé si nécessaire
});

/**
 * Middleware pour ajouter des en-têtes de sécurité personnalisés
 */
export const customSecurityHeaders = (req, res, next) => {
    // Désactiver la mise en cache pour les routes sensibles
    if (req.path.startsWith("/api/auth") || req.path.startsWith("/api/admin")) {
        res.set(
            "Cache-Control",
            "no-store, no-cache, must-revalidate, private"
        );
        res.set("Pragma", "no-cache");
        res.set("Expires", "0");
    }

    // Ajouter un header X-Content-Type-Options
    res.set("X-Content-Type-Options", "nosniff");

    // Ajouter un header X-Frame-Options
    res.set("X-Frame-Options", "DENY");

    // Ajouter un header X-XSS-Protection
    res.set("X-XSS-Protection", "1; mode=block");

    next();
};

/**
 * Middleware pour nettoyer les entrées utilisateur
 * Échappe les caractères dangereux dans les paramètres de requête
 */
export const sanitizeInput = (req, res, next) => {
    // Fonction pour nettoyer une valeur
    const sanitize = (value) => {
        if (typeof value === "string") {
            // Échapper les caractères HTML
            return value
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#x27;")
                .replace(/\//g, "&#x2F;");
        }
        return value;
    };

    // Nettoyer les paramètres de requête
    if (req.query) {
        Object.keys(req.query).forEach((key) => {
            req.query[key] = sanitize(req.query[key]);
        });
    }

    // Nettoyer les paramètres d'URL
    if (req.params) {
        Object.keys(req.params).forEach((key) => {
            req.params[key] = sanitize(req.params[key]);
        });
    }

    next();
};
