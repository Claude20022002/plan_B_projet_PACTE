import { ErreurMetier } from "../services/planning/enseignements.js";
import { ViolationsBloquantes } from "../services/planning/seances.js";
import { repondreErreur } from "./erreurs.js";

/**
 * Réponse commune aux erreurs de planification, au format commun (utils/erreurs.js) : 409 avec la
 * liste des règles enfreintes (le message est la première règle bloquante, la plus utile à lire),
 * statut métier (400, 403, 404…) sinon ; toute autre erreur remonte au gestionnaire global.
 */
export const repondreErreurPlanning = (res, error) => {
    if (error instanceof ViolationsBloquantes) {
        const premiere = error.violations.find((v) => v.bloquant)?.message;
        return repondreErreur(res, 409, premiere ?? error.message, { code: "REGLES_ENFREINTES", violations: error.violations });
    }
    if (error instanceof ErreurMetier) return repondreErreur(res, error.status, error.message, { code: error.code });
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
