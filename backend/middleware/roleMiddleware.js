/**
 * Middleware de vérification des rôles
 * Vérifie que l'utilisateur authentifié a le bon rôle
 */

const unauthenticated = (res) =>
    res.status(401).json({
        message: "Authentification requise",
        error: "Vous devez être connecté pour accéder à cette ressource",
    });

/**
 * Vérifier que l'utilisateur a au moins un des rôles spécifiés
 * @param {...string} roles - Liste des rôles autorisés
 */
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return unauthenticated(res);
        }

        // Source de vérité unique : le rôle du compte (modifiable uniquement par un admin)
        const currentRole = req.user.role;

        if (!roles.includes(currentRole)) {
            return res.status(403).json({
                message: "Accès interdit",
                error: `Accès réservé aux rôles: ${roles.join(", ")}`,
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
 * Vérifier que l'utilisateur accède à ses propres ressources ou qu'il est administrateur.
 * L'identifiant est lu UNIQUEMENT dans les paramètres d'URL : le corps de la requête
 * est contrôlé par le client et ne peut pas servir à prouver la propriété.
 * @param {string} idParam - Nom du paramètre d'URL contenant l'ID (ex: "id", "id_enseignant")
 */
export const requireOwnResourceOrAdmin = (idParam = "id") => {
    return (req, res, next) => {
        if (!req.user) {
            return unauthenticated(res);
        }

        if (req.user.role === "admin") {
            return next();
        }

        const resourceId = Number.parseInt(req.params[idParam], 10);
        if (Number.isInteger(resourceId) && resourceId === req.user.id_user) {
            return next();
        }

        return res.status(403).json({
            message: "Accès interdit",
            error: "Vous ne pouvez accéder qu'à vos propres ressources",
        });
    };
};
