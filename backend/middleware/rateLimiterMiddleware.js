/**
 * Middleware de limitation du taux de requêtes (Rate Limiting)
 * Protège l'API contre les abus et les attaques par force brute
 */

// Store simple en mémoire (en production, utiliser Redis)
const requestCounts = new Map();

/**
 * Configuration par défaut du rate limiter
 */
const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes par fenêtre
    message: "Trop de requêtes depuis cette IP, veuillez réessayer plus tard.",
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
};

/**
 * Créer un rate limiter personnalisé
 * @param {Object} options - Options de configuration
 */
export const createRateLimiter = (options = {}) => {
    const config = { ...defaultOptions, ...options };

    return (req, res, next) => {
        const key = req.ip || req.connection.remoteAddress;
        const now = Date.now();
        const windowStart = now - config.windowMs;

        // Nettoyer les entrées expirées (simple nettoyage)
        if (requestCounts.size > 1000) {
            for (const [ip, data] of requestCounts.entries()) {
                if (data.windowStart < windowStart) {
                    requestCounts.delete(ip);
                }
            }
        }

        // Récupérer ou créer les données pour cette IP
        if (!requestCounts.has(key)) {
            requestCounts.set(key, {
                count: 0,
                windowStart: now,
                resetTime: now + config.windowMs,
            });
        }

        const requestData = requestCounts.get(key);

        // Si la fenêtre est expirée, la réinitialiser
        if (requestData.windowStart < windowStart) {
            requestData.count = 0;
            requestData.windowStart = now;
            requestData.resetTime = now + config.windowMs;
        }

        // Vérifier la limite
        if (requestData.count >= config.max) {
            const retryAfter = Math.ceil((requestData.resetTime - now) / 1000);
            return res.status(429).json({
                message: "Trop de requêtes",
                error: config.message,
                retryAfter: retryAfter, // en secondes
                resetTime: new Date(requestData.resetTime).toISOString(),
            });
        }

        // Incrémenter le compteur
        requestData.count++;

        // Ajouter les en-têtes de rate limiting
        res.set({
            "X-RateLimit-Limit": config.max,
            "X-RateLimit-Remaining": Math.max(
                0,
                config.max - requestData.count
            ),
            "X-RateLimit-Reset": new Date(requestData.resetTime).toISOString(),
        });

        // Callback après la réponse (pour skipSuccessfulRequests/skipFailedRequests)
        const originalSend = res.send;
        res.send = function (body) {
            const statusCode = res.statusCode;

            // Si on doit skip les requêtes réussies/échouées
            if (
                (config.skipSuccessfulRequests &&
                    statusCode >= 200 &&
                    statusCode < 300) ||
                (config.skipFailedRequests && statusCode >= 400)
            ) {
                requestData.count = Math.max(0, requestData.count - 1);
            }

            return originalSend.call(this, body);
        };

        next();
    };
};

/**
 * Rate limiter strict pour l'authentification (limite plus basse)
 */
export const authRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 tentatives de connexion
    message:
        "Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.",
});

/**
 * Rate limiter standard pour l'API
 */
export const apiRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requêtes
    message: "Trop de requêtes, veuillez réessayer plus tard.",
});

/**
 * Rate limiter permissif pour les routes publiques
 */
export const publicRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requêtes
    message: "Trop de requêtes, veuillez réessayer plus tard.",
});
