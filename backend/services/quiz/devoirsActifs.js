/**
 * Interrupteur des devoirs côté serveur (lot D-2). L'école ne fait pour le moment que des jeux
 * pédagogiques : les devoirs sont fermés, sans que leur code ni leurs tables soient retirés, car
 * ils pourront revenir. Le site et l'application ont leur propre interrupteur (shared/fonctions.js,
 * lot D-1) : les deux se rallument ensemble.
 */

/** Message rendu par une route de devoir quand les devoirs sont fermés. */
export const MESSAGE_DEVOIRS_FERMES = "Les devoirs sont indisponibles pour le moment";

/**
 * Lu à chaque appel, et non au chargement du module, pour qu'un test puisse fermer puis rouvrir
 * les devoirs. Éteint par défaut : seule la valeur « true » les ouvre.
 * @returns {boolean} vrai si les devoirs sont ouverts (DEVOIRS_ACTIFS=true)
 */
export const devoirsActifs = () => process.env.DEVOIRS_ACTIFS === "true";

/** Middleware : répond 503 « indisponible » tant que les devoirs sont fermés, laisse passer sinon. */
export const exigerDevoirsActifs = (req, res, next) => {
    if (devoirsActifs()) return next();
    return res.status(503).json({ message: MESSAGE_DEVOIRS_FERMES, error: MESSAGE_DEVOIRS_FERMES, code: "DEVOIRS_FERMES" });
};
