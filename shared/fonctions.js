/**
 * Interrupteurs des fonctions, lus par le site et par l'application (un seul endroit à changer).
 *
 * Devoirs (plan assainissement, lot D-1) : l'école ne fait pour le moment que des jeux
 * pédagogiques. Les devoirs sont masqués, pas supprimés : écrans, routes et traductions restent
 * dans le code, pour qu'ils puissent revenir en passant l'interrupteur à true. Le serveur les
 * ferme de son côté par sa variable DEVOIRS_ACTIFS (lot D-2).
 */
export const DEVOIRS_ACTIFS = false;

/**
 * Contexte i18next des textes qui citent les devoirs : rend 'sansDevoirs' quand ils sont masqués,
 * undefined sinon. t('cle', { context: CONTEXTE_DEVOIRS }) lit alors 'cle_sansDevoirs' s'il existe,
 * et 'cle' sinon : seuls les textes qui parlent de devoirs ont besoin d'une variante.
 */
export const CONTEXTE_DEVOIRS = DEVOIRS_ACTIFS ? undefined : 'sansDevoirs';
