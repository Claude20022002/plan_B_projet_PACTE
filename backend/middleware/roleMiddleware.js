/**
 * Middleware de vérification des rôles
 * Vérifie que l'utilisateur authentifié a le bon rôle
 */

/**
 * Vérifier que l'utilisateur a au moins un des rôles spécifiés
 * @param {...string} roles - Liste des rôles autorisés
 */
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentification requise",
                error: "Vous devez être connecté pour accéder à cette ressource",
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Accès interdit",
                error: `Accès réservé aux rôles: ${roles.join(
                    ", "
                )}. Votre rôle: ${req.user.role}`,
            });
        }

        next();
    };
};

/**
 * Vérifier que l'utilisateur est un administrateur
 */
export const requireAdmin = requireRole("admin");

/**
 * Vérifier que l'utilisateur est un enseignant
 */
export const requireEnseignant = requireRole("enseignant", "admin");

/**
 * Vérifier que l'utilisateur est un étudiant
 */
export const requireEtudiant = requireRole("etudiant", "admin");

/**
 * Vérifier que l'utilisateur peut accéder à ses propres ressources
 * ou qu'il est administrateur
 * @param {string} idParam - Nom du paramètre contenant l'ID (ex: "id_user", "id")
 */
export const requireOwnResourceOrAdmin = (idParam = "id") => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentification requise",
                error: "Vous devez être connecté pour accéder à cette ressource",
            });
        }

        const resourceId = parseInt(
            req.params[idParam] ||
                req.params.id ||
                req.body[idParam] ||
                req.body.id_user
        );
        const userId = req.user.id_user;

        // Admin a accès à tout
        if (req.user.role === "admin") {
            return next();
        }

        // Vérifier que l'utilisateur accède à ses propres ressources
        if (resourceId && resourceId === userId) {
            return next();
        }

        return res.status(403).json({
            message: "Accès interdit",
            error: "Vous ne pouvez accéder qu'à vos propres ressources",
        });
    };
};

/**
 * Vérifier que l'utilisateur peut modifier une ressource qu'il a créée
 * ou qu'il est administrateur
 * @param {string} userIdField - Champ contenant l'ID du créateur (ex: "id_user_admin", "id_user_enseignant")
 */
export const requireOwnCreationOrAdmin = (userIdField) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                message: "Authentification requise",
                error: "Vous devez être connecté pour accéder à cette ressource",
            });
        }

        // Admin a accès à tout
        if (req.user.role === "admin") {
            return next();
        }

        // Chercher la ressource dans req.body ou req.params
        const resourceId = req.params.id || req.body.id;
        if (!resourceId || !userIdField) {
            return next();
        }

        try {
            // Importer le modèle approprié (sera défini selon la route)
            // Cette fonction sera généralement utilisée avec des middlewares spécifiques
            // Pour l'instant, on accepte si le champ userId correspond
            if (
                req.body[userIdField] &&
                req.body[userIdField] === req.user.id_user
            ) {
                return next();
            }

            return res.status(403).json({
                message: "Accès interdit",
                error: "Vous ne pouvez modifier que les ressources que vous avez créées",
            });
        } catch (error) {
            return res.status(500).json({
                message: "Erreur de vérification",
                error: error.message,
            });
        }
    };
};
