import crypto from "crypto";
import sequelize from "../config/db.js";

/**
 * Middleware de limitation du taux de requêtes (Rate Limiting)
 * Protège l'API contre les abus et les attaques par force brute.
 *
 * Deux magasins de compteurs :
 *  - en mémoire : limiteur global de l'API (chaque requête ; une écriture en base serait coûteuse) ;
 *  - en base (`persistant`) : limiteurs de la connexion, qui doivent survivre à un redémarrage du
 *    serveur et seraient partagés entre plusieurs instances (table CompteursDebit).
 * RATE_LIMIT_PERSISTANT=false met tout en mémoire (tests automatisés).
 */

// Un magasin par limiteur : partager les compteurs ferait compter une requête de connexion dans
// le quota global et inversement
const tousLesMagasins = new Set();

/**
 * Vide tous les compteurs — réservé aux tests automatisés.
 */
export const resetRateLimiters = () => Promise.all([...tousLesMagasins].map((m) => m.vider()));

// Au-delà, les entrées les plus anciennes sont oubliées : des clés toujours nouvelles (adresses,
// emails inventés) ne font pas grossir la mémoire sans fin
const ENTREES_MAX = 10000;

const magasinMemoire = () => {
    const compteurs = new Map();
    return {
        vider: async () => compteurs.clear(),
        compter: async (cle, fenetreMs, maintenant) => {
            if (compteurs.size > ENTREES_MAX) {
                for (const [k, d] of compteurs) if (d.reset <= maintenant) compteurs.delete(k);
                for (const k of compteurs.keys()) {
                    if (compteurs.size <= ENTREES_MAX) break;
                    compteurs.delete(k);
                }
            }
            let donnees = compteurs.get(cle);
            if (!donnees || donnees.reset <= maintenant) {
                donnees = { count: 0, reset: maintenant + fenetreMs };
                compteurs.set(cle, donnees);
            }
            donnees.count += 1;
            return { count: donnees.count, reset: donnees.reset };
        },
        retirer: async (cle) => {
            const donnees = compteurs.get(cle);
            if (donnees) donnees.count = Math.max(0, donnees.count - 1);
        },
    };
};

/** Magasin en base : incrément atomique (une seule instruction, nouvelle fenêtre si expirée). */
export const magasinBase = (nom) => {
    const cleDe = (cle) => `${nom}:${crypto.createHash("sha256").update(String(cle)).digest("hex")}`;
    return {
        vider: () => sequelize.query("DELETE FROM CompteursDebit WHERE cle LIKE ?", { replacements: [`${nom}:%`] }),
        compter: async (cle, fenetreMs, maintenant) => {
            const k = cleDe(cle);
            await sequelize.query(
                `INSERT INTO CompteursDebit (cle, compteur, expire_ms) VALUES (?, 1, ?)
                 ON DUPLICATE KEY UPDATE compteur = IF(expire_ms <= ?, 1, compteur + 1), expire_ms = IF(expire_ms <= ?, ?, expire_ms)`,
                { replacements: [k, maintenant + fenetreMs, maintenant, maintenant, maintenant + fenetreMs] }
            );
            const [[ligne]] = await sequelize.query("SELECT compteur, expire_ms FROM CompteursDebit WHERE cle = ?", { replacements: [k] });
            return { count: Number(ligne.compteur), reset: Number(ligne.expire_ms) };
        },
        retirer: (cle) => sequelize.query("UPDATE CompteursDebit SET compteur = GREATEST(compteur - 1, 0) WHERE cle = ?", { replacements: [cleDe(cle)] }),
    };
};

/** Lignes des fenêtres terminées (tâche quotidienne). Renvoie leur nombre. */
export const purgerCompteursDebit = async (maintenant = Date.now()) => {
    const [resultat] = await sequelize.query("DELETE FROM CompteursDebit WHERE expire_ms <= ?", { replacements: [maintenant] });
    return resultat?.affectedRows ?? 0;
};

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
 * @param {Object} options - Options de configuration ; `keyGenerator(req)` choisit la clé
 *   comptée (l'adresse IP par défaut), une clé nulle laisse passer sans compter ; `persistant`
 *   (avec un `nom` unique) garde les compteurs en base ; `magasin` en impose un (tests)
 */
export const createRateLimiter = (options = {}) => {
    const config = { ...defaultOptions, ...options };
    const persistant = config.persistant && process.env.RATE_LIMIT_PERSISTANT !== "false";
    const magasin = config.magasin ?? (persistant ? magasinBase(config.nom) : magasinMemoire());
    tousLesMagasins.add(magasin);
    const keyGenerator = config.keyGenerator ?? ((req) => req.ip || req.socket?.remoteAddress);

    return async (req, res, next) => {
        const key = keyGenerator(req);
        if (key === null || key === undefined) return next();
        const now = Date.now();

        let compte;
        try {
            compte = await magasin.compter(key, config.windowMs, now);
        } catch (error) {
            // Base indisponible : on laisse passer (la connexion échouera d'elle-même sans base)
            console.error("Limiteur de débit :", error.message);
            return next();
        }

        // Vérifier la limite
        if (compte.count > config.max) {
            return res.status(429).json({
                message: "Trop de requêtes",
                error: config.message,
                retryAfter: Math.ceil((compte.reset - now) / 1000), // en secondes
                resetTime: new Date(compte.reset).toISOString(),
            });
        }

        // Ajouter les en-têtes de rate limiting
        res.set({
            "X-RateLimit-Limit": config.max,
            "X-RateLimit-Remaining": Math.max(0, config.max - compte.count),
            "X-RateLimit-Reset": new Date(compte.reset).toISOString(),
        });

        // Callback après la réponse (pour skipSuccessfulRequests/skipFailedRequests)
        const originalSend = res.send;
        res.send = function (body) {
            const statusCode = res.statusCode;
            if (
                (config.skipSuccessfulRequests && statusCode >= 200 && statusCode < 300) ||
                (config.skipFailedRequests && statusCode >= 400)
            ) {
                magasin.retirer(key).catch((error) => console.error("Limiteur de débit :", error.message));
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
    nom: "auth",
    persistant: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 tentatives de connexion (augmenté)
    message:
        "Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.",
});

/**
 * Connexion : seuls les échecs comptent (tout un campus partage la même adresse IP et se
 * connecte à 8 h), par adresse et par compte. La limite par compte arrête aussi une attaque
 * répartie sur de nombreuses adresses ; le compte visé est bloqué 15 minutes au plus.
 */
export const loginIpRateLimiter = createRateLimiter({
    nom: "connexion-ip",
    persistant: true,
    windowMs: 15 * 60 * 1000,
    max: 30,
    skipSuccessfulRequests: true,
    message: "Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.",
});

export const loginCompteRateLimiter = createRateLimiter({
    nom: "connexion-compte",
    persistant: true,
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    // Email non textuel : refusé par la connexion (400), rien à compter par compte
    keyGenerator: (req) => (typeof req.body?.email === "string" ? `compte:${req.body.email.trim().toLowerCase()}` : null),
    message: "Trop de tentatives de connexion sur ce compte, veuillez réessayer dans 15 minutes.",
});

/**
 * Rate limiter standard pour l'API
 */
export const apiRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // 500 requêtes (augmenté pour éviter les erreurs 429)
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
