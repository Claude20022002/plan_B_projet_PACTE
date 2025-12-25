/**
 * Middleware de gestion centralisée des erreurs
 */

/**
 * Middleware de gestion globale des erreurs
 * Doit être placé en dernier dans le fichier server.js
 */
export const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log de l'erreur pour le débogage
    console.error("❌ Erreur:", err);

    // Erreur Sequelize - Validation
    if (err.name === "SequelizeValidationError") {
        const message = err.errors.map((e) => e.message).join(", ");
        error = {
            message: "Erreur de validation",
            errors: err.errors.map((e) => ({
                field: e.path,
                message: e.message,
            })),
        };
        return res.status(400).json(error);
    }

    // Erreur Sequelize - Contrainte unique
    if (err.name === "SequelizeUniqueConstraintError") {
        const message = err.errors.map((e) => e.message).join(", ");
        error = {
            message: "Erreur de contrainte unique",
            error: "Une ressource avec ces valeurs existe déjà",
            details: err.errors.map((e) => ({
                field: e.path,
                message: e.message,
            })),
        };
        return res.status(409).json(error);
    }

    // Erreur Sequelize - Clé étrangère
    if (err.name === "SequelizeForeignKeyConstraintError") {
        error = {
            message: "Erreur de référence",
            error: "La ressource référencée n'existe pas",
            details: err.message,
        };
        return res.status(400).json(error);
    }

    // Erreur Sequelize - Base de données
    if (err.name === "SequelizeDatabaseError") {
        error = {
            message: "Erreur de base de données",
            error: "Une erreur s'est produite lors de l'accès à la base de données",
        };
        return res.status(500).json(error);
    }

    // Erreur JWT
    if (err.name === "JsonWebTokenError") {
        error = {
            message: "Token invalide",
            error: "Le token fourni n'est pas valide",
        };
        return res.status(401).json(error);
    }

    if (err.name === "TokenExpiredError") {
        error = {
            message: "Token expiré",
            error: "Votre session a expiré, veuillez vous reconnecter",
        };
        return res.status(401).json(error);
    }

    // Erreur par défaut
    res.status(error.statusCode || 500).json({
        message: error.message || "Erreur serveur",
        error:
            process.env.NODE_ENV === "production"
                ? "Une erreur s'est produite"
                : err.message,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
};

/**
 * Middleware pour les routes non trouvées (404)
 */
export const notFound = (req, res, next) => {
    const error = new Error(`Route non trouvée - ${req.originalUrl}`);
    res.status(404);
    next(error);
};
