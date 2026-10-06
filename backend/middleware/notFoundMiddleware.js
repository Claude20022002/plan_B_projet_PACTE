/**
 * Middleware pour gérer les routes non trouvées (404)
 */
export const notFound = (req, res, next) => {
    const error = new Error(`Route non trouvée - ${req.originalUrl}`);
    // Le gestionnaire global lit le code sur l'erreur (sinon 500)
    error.statusCode = 404;
    next(error);
};
