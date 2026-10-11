/**
 * Écran de l'application ouvert par une alerte (liste des alertes, ou notification push touchée),
 * d'après son lien (lot R-14). Seuls des écrans internes sont ouverts ; tout autre lien mène à la
 * liste des alertes.
 *
 * Quiz : le serveur peut préciser la partie dans le lien, sans gêner le site qui l'ignore :
 * « /jeux?partie=<id> » ouvre directement la partie en cours, « /jeux?resultats=<id> » ses
 * résultats ; « /jeux » seul ouvre la page Activités.
 */

const ECRANS_AUTORISES = new Set(['/', '/semaine', '/alertes', '/jeux']);
const ANNONCE = /^\/annonces\/(\d+)$/;
const QUIZ = /^\/jeux\?(partie|resultats)=(\d+)$/;

/** Chemin de l'application pour le lien d'une alerte. */
export const ecranDeLien = (lien) => {
  if (typeof lien !== 'string') return '/alertes';
  if (lien.startsWith('/emploi-du-temps')) return '/semaine';
  const annonce = ANNONCE.exec(lien);
  if (annonce) return `/annonce/${annonce[1]}`;
  const quiz = QUIZ.exec(lien);
  if (quiz) return quiz[1] === 'partie' ? `/partie/${quiz[2]}` : `/resultats/${quiz[2]}`;
  return ECRANS_AUTORISES.has(lien) ? lien : '/alertes';
};

/** Vrai si toucher l'alerte ouvre un écran précis (pas seulement la liste des alertes). */
export const alerteOuvrable = (lien) => ecranDeLien(lien) !== '/alertes';
