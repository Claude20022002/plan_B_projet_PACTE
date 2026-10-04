import { ErreurMetier } from "../services/planning/enseignements.js";
import { ViolationsBloquantes } from "../services/planning/seances.js";

/**
 * Réponse commune aux erreurs de planification : 409 avec la liste des règles enfreintes,
 * statut métier (400, 403, 404) sinon ; toute autre erreur remonte au gestionnaire global.
 */
export const repondreErreurPlanning = (res, error) => {
    if (error instanceof ViolationsBloquantes) {
        return res.status(409).json({ message: error.message, error: error.violations.find((v) => v.bloquant)?.message, violations: error.violations });
    }
    if (error instanceof ErreurMetier) return res.status(error.status).json({ message: error.message, error: error.message });
    throw error;
};

/** Enveloppe un contrôleur de planification : erreurs métier traduites, le reste propagé. */
export const planification = (fn) => async (req, res, next) => {
    try {
        await fn(req, res);
    } catch (error) {
        try {
            repondreErreurPlanning(res, error);
        } catch (autre) {
            next(autre);
        }
    }
};
