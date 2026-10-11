/**
 * Changement de téléphone (R-10) : ce que l'écran dit à l'étudiant selon sa dernière demande.
 * Logique pure, testée (__tests__/telephone.test.js).
 */

const ETATS = { en_attente: 'enAttente', acceptee: 'acceptee', refusee: 'refusee' };

/**
 * Rend la clé du texte d'état (app.telephone.etats.*). Le bouton « Déclarer ce téléphone » reste
 * toujours proposé : une nouvelle déclaration remplace une demande en attente, et après un refus ou
 * un nouveau changement l'étudiant doit pouvoir recommencer.
 */
export const cleEtat = (demande) => ETATS[demande?.statut] ?? 'aucune';

/**
 * Vrai si un refus du scan peut venir d'un changement de téléphone : le serveur répond 409 quand
 * le compte est lié à un autre téléphone (ou ce téléphone à un autre compte, ce que l'écran dira).
 */
export const proposerChangement = (erreur) => erreur?.statut === 409;
