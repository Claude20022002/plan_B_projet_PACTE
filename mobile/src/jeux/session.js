/**
 * Sessions de jeu lancées en classe : le QR projeté par l'enseignant est l'adresse
 * …/jeux/session/<code> de Planner. Le même viseur que l'appel et les quiz le lit ; l'application
 * n'en garde que le code et rejoint la session par l'API (jamais d'adresse ouverte telle quelle).
 */

const MOTIF = /\/jeux\/session\/([A-Z0-9]{6})(?:[?#]|$)/;

/** Code de la session lu dans un QR, ou null si le QR n'en est pas un (appel, quiz, autre) */
export const codeSessionScanne = (texte) => (typeof texte === 'string' ? MOTIF.exec(texte)?.[1] ?? null : null);

/** Écran où mène une session rejointe : le tableau de la classe, ou le jeu lui-même */
export const ecranDeSession = (session) => {
  if (session?.mode === 'collectif') return `/jeu-direct/${session.id_session_jeu}`;
  return session?.code_jeu === 'terminal-linux' ? '/terminal' : null;
};
