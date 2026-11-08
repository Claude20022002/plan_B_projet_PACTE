/** Aides communes aux moteurs de simulation (aucune exécution de code utilisateur). */

export const memeCase = (a, b) => a[0] === b[0] && a[1] === b[1];
export const entier = (n, max) => Number.isInteger(n) && n >= 0 && n <= max;
export const entierEntre = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
export const arrondi = (n) => Math.round(n * 100) / 100;

/** Convertit une valeur de formulaire en entier 0-999 uniquement si elle est complète. */
export const nombre = (v) => (/^\d{1,3}$/.test(String(v)) ? Number(v) : null);

export const mouvements = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };

/** Grille de criticité canonique : portée × multiplicateur de données × multiplicateur de statut. */
export const MULT_DATA = { public: 1, confidentiel: 2, secret: 3 };
export const MULT_STATUT = { contenu: 1, actif: 2 };
export const niveauDuScore = (s) => (s >= 30 ? 1 : s >= 12 ? 2 : s >= 4 ? 3 : 4);
