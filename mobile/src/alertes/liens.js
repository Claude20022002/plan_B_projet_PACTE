/**
 * Écran de l'application ouvert par une alerte (liste des alertes, ou notification push touchée),
 * d'après son lien (lot R-14). Seuls des écrans internes sont ouverts ; tout autre lien mène à la
 * liste des alertes.
 *
 * Quiz : le serveur peut préciser la partie dans le lien, sans gêner le site qui l'ignore :
 * « /jeux?partie=<id> » ouvre directement la partie en cours, « /jeux?resultats=<id> » ses
 * résultats ; « /jeux » seul ouvre la page Activités. Emploi du temps : « ?date=AAAA-MM-JJ » ouvre la
 * semaine de cette date (report de séance).
 */

const ECRANS_AUTORISES = new Set(['/', '/semaine', '/alertes', '/jeux']);
const ANNONCE = /^\/annonces\/(\d+)$/;
const QUIZ = /^\/jeux\?(partie|resultats)=(\d+)$/;
const SEMAINE = /^\/emploi-du-temps(?:\/\w+)?\?date=(\d{4}-\d{2}-\d{2})$/;

/** Chemin de l'application pour le lien d'une alerte. */
export const ecranDeLien = (lien) => {
  if (typeof lien !== 'string') return '/alertes';
  // Report : la semaine de la nouvelle date (« ?date=AAAA-MM-JJ »), sinon la semaine en cours
  const semaine = SEMAINE.exec(lien);
  if (semaine) return `/semaine?date=${semaine[1]}`;
  if (lien.startsWith('/emploi-du-temps')) return '/semaine';
  const annonce = ANNONCE.exec(lien);
  if (annonce) return `/annonce/${annonce[1]}`;
  const quiz = QUIZ.exec(lien);
  if (quiz) return quiz[1] === 'partie' ? `/partie/${quiz[2]}` : `/resultats/${quiz[2]}`;
  return ECRANS_AUTORISES.has(lien) ? lien : '/alertes';
};

/** Vrai si toucher l'alerte ouvre un écran précis (pas seulement la liste des alertes). */
export const alerteOuvrable = (lien) => ecranDeLien(lien) !== '/alertes';
