/**
 * Les espaces de la plateforme HESTIM, dans le même ordre et sous les mêmes noms partout
 * (Planner web, application mobile, StudyLib, ClassQuiz) : depuis n'importe quel écran, le
 * sélecteur d'espaces mène à chacun en deux gestes (ouvrir le sélecteur, choisir l'espace).
 *
 * Chemins relatifs à l'origine de la plateforme (Planner et StudyLib partagent la même) ;
 * ClassQuiz vit sur son sous-domaine (QUIZ_URL, renvoyé par GET /api/quiz/config).
 */
export const ESPACES = [
  {
    code: 'planner',
    icone: 'calendar',
    titre: { fr: 'Planner', en: 'Planner' },
    resume: { fr: 'Emploi du temps, séances, salles', en: 'Timetable, sessions, rooms' },
    // Tableau du rôle connecté (redirection de Planner) : les autres espaces ne connaissent pas le rôle
    chemin: '/tableau',
  },
  {
    code: 'bibliotheque',
    icone: 'library',
    titre: { fr: 'Bibliothèque', en: 'Library' },
    resume: { fr: 'Supports de cours, stages, projets', en: 'Course materials, internships, projects' },
    chemin: '/biblio/',
  },
  {
    code: 'jeux',
    icone: 'games',
    titre: { fr: 'Jeux', en: 'Games' },
    resume: { fr: 'Terminal Linux et défis de vos modules', en: 'Linux terminal and module challenges' },
    chemin: '/jeux',
  },
  {
    code: 'quiz',
    icone: 'quiz',
    titre: { fr: 'Quiz', en: 'Quiz' },
    resume: { fr: 'Quiz en direct pendant la séance', en: 'Live quizzes during class' },
    // Adresse absolue fournie par la configuration ; null si ClassQuiz n'est pas installé
    chemin: null,
  },
];

/**
 * Adresse d'un espace pour un rôle donné. Quiz : l'enseignant arrive sur ses quiz (connexion
 * unique par Planner), l'étudiant sur la saisie du code de partie.
 * @param {string} code
 * @param {{ role?: string, urlQuiz?: string|null }} contexte
 * @returns {string|null} null si l'espace n'est pas disponible
 */
export const adresseEspace = (code, { role, urlQuiz } = {}) => {
  if (code === 'quiz') {
    if (typeof urlQuiz !== 'string' || !/^https?:\/\//.test(urlQuiz)) return null;
    const base = urlQuiz.replace(/\/$/, '');
    return ['enseignant', 'admin'].includes(role) ? `${base}/dashboard` : `${base}/play`;
  }
  return ESPACES.find((e) => e.code === code)?.chemin ?? null;
};
