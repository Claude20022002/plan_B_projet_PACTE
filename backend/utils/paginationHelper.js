/**
 * Utilitaires pour la pagination
 */

/**
 * Calcule les paramètres de pagination à partir de la requête
 * @param {Object} req - Objet de requête Express
 * @param {number} defaultLimit - Limite par défaut
 * @returns {Object} - Objet avec limit, offset, page
 */
export const getPaginationParams = (req, defaultLimit = 10) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || defaultLimit;
    const offset = (page - 1) * limit;

    return {
        page: Math.max(1, page),
        limit: Math.min(100, Math.max(1, limit)), // Limite entre 1 et 100
        offset: Math.max(0, offset),
    };
};

/**
 * Crée une réponse paginée standardisée
 * @param {Array} data - Données à paginer
 * @param {number} total - Nombre total d'éléments
 * @param {number} page - Page actuelle
 * @param {number} limit - Limite par page
 * @returns {Object} - Réponse paginée
 */
export const createPaginationResponse = (data, total, page, limit) => {
    const totalPages = Math.ceil(total / limit);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
};

