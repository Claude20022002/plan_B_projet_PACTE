import { ouvrirAdresse } from '../espaces/ouvrir';
import { QUIZ_DANS_L_APPLICATION } from '../../../shared/fonctions.js';

/**
 * Ouvre une partie de quiz de l'étudiant : dans la vue navigateur (lien personnel donné par
 * Planner, avec son nom et son jeton), ou dans le lecteur natif quand QUIZ_DANS_L_APPLICATION est
 * allumé (shared/fonctions.js). `remplacer` : l'écran courant (le scanner) cède la place au lecteur.
 * Rend true si la partie a pu s'ouvrir.
 */
export const ouvrirPartie = async ({ router, partie, couleurs, remplacer = false }) => {
  if (!partie?.url) return false;
  if (QUIZ_DANS_L_APPLICATION) {
    const cible = { pathname: '/quiz', params: { url: partie.url, id: String(partie.id), titre: partie.titre } };
    if (remplacer) router.replace(cible);
    else router.push(cible);
    return true;
  }
  await ouvrirAdresse(partie.url, couleurs);
  return true;
};
