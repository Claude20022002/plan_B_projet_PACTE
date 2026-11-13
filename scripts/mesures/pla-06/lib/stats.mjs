/**
 * Statistiques des mesures PLA-06 : centiles (rang le plus proche), résumé d'une série de temps,
 * médiane et écart entre passages. Fonctions pures, sans dépendance.
 */

/** Centile p (0 à 100) d'une liste de nombres, par la méthode du rang le plus proche ; null si vide. */
export function centile(valeurs, p) {
    if (!(p >= 0 && p <= 100)) throw new RangeError(`Centile hors de 0 à 100 : ${p}`);
    const tries = valeurs.filter(Number.isFinite).sort((a, b) => a - b);
    if (!tries.length) return null;
    const rang = Math.max(1, Math.ceil((p / 100) * tries.length));
    return tries[rang - 1];
}

const arrondi = (n) => (n === null ? null : Math.round(n * 10) / 10);

/** Résumé d'une série de durées en millisecondes : nombre, min, p50, p95, p99, max, moyenne. */
export function resumer(valeurs) {
    const nombres = valeurs.filter(Number.isFinite);
    const n = nombres.length;
    return {
        n,
        min: n ? arrondi(Math.min(...nombres)) : null,
        p50: arrondi(centile(nombres, 50)),
        p95: arrondi(centile(nombres, 95)),
        p99: arrondi(centile(nombres, 99)),
        max: n ? arrondi(Math.max(...nombres)) : null,
        moyenne: n ? arrondi(nombres.reduce((s, v) => s + v, 0) / n) : null,
    };
}

/** Médiane et écart (max − min) des passages d'une même série : ce que le rapport publie. */
export function medianeEtEcart(passages) {
    const nombres = passages.filter(Number.isFinite);
    if (!nombres.length) return { mediane: null, ecart: null, passages: 0 };
    return { mediane: centile(nombres, 50), ecart: Math.max(...nombres) - Math.min(...nombres), passages: nombres.length };
}

/** Une erreur au sens du seuil S4 : réponse 5xx, refus de connexion, ou délai dépassé. */
export const estErreur = ({ statut, delaiDepasse = false, refus = false }) => refus || delaiDepasse || (Number.isInteger(statut) && statut >= 500);
