/**
 * Quiz en direct du Studio, côté application (lot SC-1c) : fonctions pures du joueur natif, sans
 * réseau. Le serveur corrige, compte les points et tient le chrono ; l'application ne fait
 * qu'afficher son état, relu chaque seconde (même principe que le joueur web, SC-1b).
 */

/** Relecture de l'état du direct : une seconde, comme sur le site (plan, lot SC-1). */
export const RELECTURE_MS = 1000;

/** Types dont la réponse part au toucher ; les autres attendent « Valider ». */
export const ENVOI_IMMEDIAT = ['choix_unique', 'vrai_faux'];

/** Rend true si la réponse est vide : rien à envoyer (texte vide, aucun choix). */
export const reponseVide = (reponse) =>
  reponse === null || reponse === undefined || (typeof reponse === 'string' && !reponse.trim()) || (Array.isArray(reponse) && !reponse.length);

/**
 * Rend l'écran natif d'un quiz du Studio rejoint par son code (réponse de /passations/rejoindre),
 * ou null : seul le direct a un écran dans l'application, les autres quiz s'ouvrent sur le site.
 */
export const ecranDuQuiz = (accueil) => (accueil?.mode === 'direct' && accueil.id_session ? `/quiz-direct/${accueil.id_session}` : null);

/**
 * Rend les secondes restantes de la question ouverte, ou null hors question. `decalageMs` : écart
 * entre l'heure du serveur et celle du téléphone, qui peut avancer ou retarder ; seul compte le
 * chrono du serveur, qui ferme la question.
 */
export const secondesRestantes = (vue, decalageMs = 0, maintenant = Date.now()) => {
  if (vue?.etape !== 'question' || vue.debut_ms === null || vue.debut_ms === undefined) return null;
  return Math.max(0, Math.ceil((vue.debut_ms + vue.duree_s * 1000 - (maintenant + decalageMs)) / 1000));
};

/** Ordre de départ d'une remise en ordre : mélangé, jamais l'ordre juste reçu du serveur (module commun). */
export { ordreDeDepart } from '../../../shared/quiz/studio/direct.js';

/** Rend l'ordre avec l'élément `de` déplacé d'un cran (`sens` : -1 vers le haut, 1 vers le bas). */
export const deplacer = (ordre, de, sens) => {
  const vers = de + sens;
  if (vers < 0 || vers >= ordre.length) return ordre;
  const suivant = [...ordre];
  [suivant[de], suivant[vers]] = [suivant[vers], suivant[de]];
  return suivant;
};

/** Rend la liste des choix avec `id` ajouté ou retiré (choix multiple). */
export const basculer = (choisis, id) => {
  const liste = Array.isArray(choisis) ? choisis : [];
  return liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id];
};

/** Rend la clé du résultat d'une réponse corrigée : juste, partiel, faux, ou sansReponse. */
export const cleResultat = (statut) => ({ juste: 'juste', partiel: 'partiel', faux: 'faux' })[statut] ?? 'sansReponse';

/**
 * Rend true si ce choix est la bonne réponse d'une question corrigée (choix unique ou multiple,
 * vrai ou faux), pour le mettre en évidence.
 */
export const estBonChoix = (bonneReponse, choix) => (Array.isArray(bonneReponse) ? bonneReponse.includes(choix) : bonneReponse === choix);
