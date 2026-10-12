import { corpsErreur } from "../utils/erreurs.js";

/**
 * Middleware de gestion centralisée des erreurs. Toutes les réponses suivent le format commun de
 * l'API, { message, code?, violations? } (utils/erreurs.js, docs/api/ERREURS.md).
 */

/**
 * Détail technique d'une erreur pour la réponse : en production il n'est jamais renvoyé
 * (il révélerait la structure de la base ou du code), seulement journalisé.
 */
export const detailErreur = (err) => (process.env.NODE_ENV === "production" ? undefined : err?.message);

const champs = (err) => err.errors.map((e) => ({ champ: e.path, message: e.message }));

/**
 * Erreurs connues (Sequelize, jetons) : rend [statut, message, options] au format commun, ou null.
 */
const erreurConnue = (err) => {
    switch (err.name) {
        case "SequelizeValidationError":
            return [400, "Erreur de validation", { code: "VALIDATION", violations: champs(err) }];
        case "SequelizeUniqueConstraintError":
            return [409, "Une ressource avec ces valeurs existe déjà", { code: "DEJA_EXISTANT", violations: champs(err) }];
        case "SequelizeForeignKeyConstraintError":
            return [400, "La ressource référencée n'existe pas", { code: "REFERENCE_INCONNUE" }];
        case "SequelizeDatabaseError":
            return [500, "Une erreur s'est produite lors de l'accès à la base de données", { code: "ERREUR_BASE" }];
        case "JsonWebTokenError":
            return [401, "Le jeton fourni n'est pas valide", { code: "TOKEN_INVALID" }];
        case "TokenExpiredError":
            return [401, "Votre session a expiré, veuillez vous reconnecter", { code: "TOKEN_EXPIRED" }];
        default:
            return null;
    }
};

/**
 * Middleware de gestion globale des erreurs, placé en dernier (app.js).
 * Quatre paramètres : c'est à leur nombre qu'Express reconnaît un gestionnaire d'erreurs.
 */
export const errorHandler = (err, req, res, _next) => {
    console.error("❌ Erreur:", err);
    const connue = erreurConnue(err);
    if (connue) {
        const [statut, message, options] = connue;
        return res.status(statut).json(corpsErreur(statut, message, options));
    }
    // Erreur par défaut : le message d'une erreur interne (500) n'est renvoyé qu'en développement
    const statut = err.statusCode || err.status || 500;
    const production = process.env.NODE_ENV === "production";
    const message = statut >= 500 && production ? "Erreur serveur" : err.message || "Erreur serveur";
    return res.status(statut).json({
        // Le code d'une erreur système (ECONNREFUSED…) ne sort pas : seulement celui d'une erreur prévue
        ...corpsErreur(statut, message, { code: statut < 500 ? err.code : undefined }),
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

/**
 * Middleware pour les routes non trouvées (404)
 */
export const notFound = (req, res, next) => {
    const error = new Error(`Route non trouvée - ${req.originalUrl}`);
    // Le gestionnaire global lit le code sur l'erreur (sinon 500)
    error.statusCode = 404;
    next(error);
};
