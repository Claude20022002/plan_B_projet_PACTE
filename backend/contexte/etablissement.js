import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Contexte d'établissement (D-03 ; essai réduit de ME-3a, revue d'expert R-2). Chaque requête,
 * tâche ou message s'exécute « dans » un établissement : { nom, sequelize, modeles }. Les modèles
 * exportés par models/index.js (des résolveurs) et les portes de models/acces.js y prennent leur
 * connexion. AsyncLocalStorage suit le contexte à travers les await et les minuteries.
 *
 * Hors contexte : l'établissement par défaut (une seule école aujourd'hui), sauf en mode strict
 * (CONTEXTE_STRICT=true), où tout accès échoue : c'est le mode visé par D-03 (« échec fermé »).
 */
const stockage = new AsyncLocalStorage();
let parDefaut = null;

export class HorsContexteError extends Error {
    constructor() {
        super("Accès à la base hors de tout établissement (D-03) : la requête ou la tâche n'a pas de contexte");
        this.name = "HorsContexteError";
    }
}

/** Exécute fn dans l'établissement donné ; le contexte suit tous les appels asynchrones de fn. */
export const dansEtablissement = (contexte, fn) => stockage.run(contexte, fn);

/** Établissement utilisé hors contexte quand le mode strict est éteint (models/index.js le déclare). */
export const definirParDefaut = (contexte) => {
    parDefaut = contexte;
};

export const etablissementParDefaut = () => parDefaut;

const strict = () => process.env.CONTEXTE_STRICT === "true";

/** L'établissement courant ; lève HorsContexteError s'il n'y en a pas. */
export const contexteCourant = () => {
    const contexte = stockage.getStore() ?? (strict() ? null : parDefaut);
    if (!contexte) throw new HorsContexteError();
    return contexte;
};
