/**
 * Quiz en direct animé depuis Planner (quiz-ia.md, lot CQ-2) : calculs purs de l'écran du
 * projecteur, à partir de ce que rend le serveur de jeu (quiz complet reçu par l'animateur,
 * réponses d'une question, résultats finaux).
 *
 * Formats des réponses du serveur de jeu : QCM et vote → texte de la réponse choisie ; cases à
 * cocher → positions cochées collées (« 013 ») ; texte, intervalle et ordre → valeur libre.
 */

// Types de question dont l'écran montre le nombre de réponses par choix
const PAR_CHOIX = ['ABCD', 'CHECK', 'VOTING'];

/** Texte d'une question ou d'une réponse sans mise en forme HTML (le quiz en autorise un peu). */
export const texteSimple = (html) =>
  String(html ?? '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .trim();

/** Adresse à mettre dans le QR projeté : celle que le scan de l'application reconnaît, ou null. */
export const adresseRejoindre = (urlQuiz, pin) =>
  typeof urlQuiz === 'string' && /^https?:\/\//.test(urlQuiz) && pin ? `${urlQuiz.replace(/\/$/, '')}/play?pin=${encodeURIComponent(pin)}` : null;

/**
 * Réponses d'une question comptées par choix, bonne réponse signalée :
 * { parChoix: [{ texte, nombre, juste }] | null, total }. parChoix vaut null pour un type sans
 * choix (texte, intervalle, ordre) : l'écran n'affiche alors que le nombre de réponses.
 */
export const decompte = (question, reponses) => {
  const liste = Array.isArray(reponses) ? reponses : [];
  const choix = Array.isArray(question?.answers) ? question.answers : null;
  if (!choix || !PAR_CHOIX.includes(question.type)) return { parChoix: null, total: liste.length };
  const parChoix = choix.map((c) => ({ texte: texteSimple(c.answer), nombre: 0, juste: Boolean(c.right) }));
  for (const r of liste) {
    if (question.type === 'CHECK') {
      // Chaque case cochée compte une fois pour le joueur
      for (const position of new Set(String(r?.answer ?? ''))) {
        if (parChoix[Number(position)]) parChoix[Number(position)].nombre += 1;
      }
    } else {
      const i = choix.findIndex((c) => c.answer === r?.answer);
      if (i >= 0) parChoix[i].nombre += 1;
    }
  }
  return { parChoix, total: liste.length };
};

/**
 * Classement de la partie, du meilleur au moins bon : [{ nom, points }]. Les joueurs qui n'ont
 * jamais répondu y figurent avec 0 point.
 */
export const classement = (resultats, joueurs = []) => {
  const points = new Map(joueurs.map((nom) => [nom, 0]));
  for (const reponses of Object.values(resultats ?? {})) {
    for (const r of Array.isArray(reponses) ? reponses : []) {
      if (r?.username) points.set(r.username, (points.get(r.username) ?? 0) + (Number(r.score) || 0));
    }
  }
  return [...points]
    .map(([nom, total]) => ({ nom, points: total }))
    .sort((a, b) => b.points - a.points || a.nom.localeCompare(b.nom));
};

/** Secondes restantes d'une question ouverte à `debut` (ms) pour `duree` secondes, jamais négatives. */
export const secondesRestantes = (debut, duree, maintenant = Date.now()) =>
  Math.max(0, Math.ceil((Number(duree) || 0) - (maintenant - debut) / 1000));
