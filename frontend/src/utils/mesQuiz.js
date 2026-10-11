/**
 * Mes quiz (IA-5) : passage entre le format du service de quiz, tel que le rend et le reçoit
 * /api/quiz/mes-quiz/:id ({ question, time, type, answers: [{ answer, right }] }), et celui du
 * brouillon que l'éditeur de questions sait modifier ({ question, type, temps, reponses: [{ texte, juste }] },
 * components/quiz/creation/QuestionBrouillon.jsx). Fonctions pures, testées (mesQuiz.test.js).
 */

/** Durée par défaut d'une question ajoutée, en secondes (celle des quiz générés par l'IA). */
export const TEMPS_PAR_DEFAUT = 30;

/** Rend une question du service de quiz au format du brouillon. */
export const versBrouillon = (q) => ({
  question: q.question ?? '',
  type: q.type === 'CHECK' ? 'CHECK' : 'ABCD',
  temps: Number(q.time) || TEMPS_PAR_DEFAUT,
  reponses: (q.answers ?? []).map((r) => ({ texte: r.answer ?? '', juste: r.right === true })),
});

/** Rend une question du brouillon au format d'écriture du service de quiz (textes sans espaces autour). */
export const versServiceQuiz = (q) => ({
  question: q.question.trim(),
  time: q.temps || TEMPS_PAR_DEFAUT,
  type: q.type,
  answers: q.reponses.map((r) => ({ answer: r.texte.trim(), right: r.juste })),
});

/** Rend une question vide, à choix unique, prête à remplir. */
export const questionVide = () => ({
  question: '',
  type: 'ABCD',
  temps: TEMPS_PAR_DEFAUT,
  reponses: [
    { texte: '', juste: true },
    { texte: '', juste: false },
  ],
});
