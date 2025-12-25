/**
 * Middleware pour gérer les routes non trouvées (404)
 */
export const notFound = (req, res, next) => {
    const error = new Error(`Route non trouvée - ${req.originalUrl}`);
    res.status(404);
    next(error);
};
