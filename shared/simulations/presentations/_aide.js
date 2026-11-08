/** Aides partagées par les modules de présentation des simulations (web et natif). */

/** Lit une branche linguistique d'une valeur bilingue du catalogue ; retombe sur une chaîne simple. */
export const lireTexte = (u, langue) => (typeof u === 'string' ? u : u?.[langue] ?? u?.fr ?? u?.en ?? '');
