/**
 * Brouillon d'un quiz avant sa création (relu par l'enseignant) : limites, mêmes que celles du
 * serveur (backend/services/ia, qui revalide tout), et contrôle avant enregistrement.
 */

export const QUESTION_MAX = 500;
export const REPONSE_MAX = 200;
export const REPONSES_MIN = 2;
export const REPONSES_MAX = 6;

/** Première erreur d'un brouillon (clé de traduction et numéro de question), ou null. */
export const erreurDuBrouillon = (questions) => {
  if (!questions.length) return { cle: 'jeux.quizIa.erreurs.vide' };
  for (const [i, q] of questions.entries()) {
    const numero = i + 1;
    const textes = q.reponses.map((r) => r.texte.trim());
    const justes = q.reponses.filter((r) => r.juste).length;
    if (!q.question.trim()) return { cle: 'jeux.quizIa.erreurs.enonce', numero };
    if (textes.some((x) => !x)) return { cle: 'jeux.quizIa.erreurs.reponseVide', numero };
    if (new Set(textes.map((x) => x.toLowerCase())).size !== textes.length) return { cle: 'jeux.quizIa.erreurs.doublon', numero };
    if (!justes) return { cle: 'jeux.quizIa.erreurs.aucuneJuste', numero };
    if (justes === q.reponses.length) return { cle: 'jeux.quizIa.erreurs.toutesJustes', numero };
    if (q.type === 'ABCD' && justes !== 1) return { cle: 'jeux.quizIa.erreurs.uneSeule', numero };
  }
  return null;
};
