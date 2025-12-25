/**
 * Export centralisé de tous les middlewares
 */

// Authentification
export { authenticateToken, optionalAuth } from "./authMiddleware.js";

// Rôles et permissions
export {
    requireRole,
    requireAdmin,
    requireEnseignant,
    requireEtudiant,
    requireOwnResourceOrAdmin,
    requireOwnCreationOrAdmin,
} from "./roleMiddleware.js";

// Gestion des erreurs
export { errorHandler, notFound } from "./errorHandler.js";
export { asyncHandler } from "./asyncHandler.js";

// Validation
export {
    handleValidationErrors,
    validateUserCreation,
    validateUserUpdate,
    validateIdParam,
    validateEnseignantCreation,
    validateEtudiantCreation,
    validateFiliereCreation,
    validateGroupeCreation,
    validateSalleCreation,
    validateCoursCreation,
    validateCreneauCreation,
    validateAffectationCreation,
    validateDemandeReportCreation,
    validateConflitCreation,
    validateNotificationCreation,
    validateDisponibiliteCreation,
    validateAppartenirCreation,
} from "./validationMiddleware.js";

// Logging
export { logger, errorLogger, requestLogger } from "./loggerMiddleware.js";

// Route non trouvée (déjà exporté depuis errorHandler)
// export { notFound } from "./notFoundMiddleware.js";

// Rate limiting
export {
    createRateLimiter,
    authRateLimiter,
    apiRateLimiter,
    publicRateLimiter,
} from "./rateLimiterMiddleware.js";

// Sécurité
export {
    securityHeaders,
    customSecurityHeaders,
    sanitizeInput,
} from "./securityMiddleware.js";
