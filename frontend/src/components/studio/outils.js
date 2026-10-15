/** Fonctions partagées par les écrans du Studio quiz (hors composants, pour le rechargement à chaud). */
import { CODES_TYPES } from '../../../../shared/quiz/studio/types.js';

export const TYPES_ORDONNES = CODES_TYPES;

/** « 1:05 » à partir de secondes. */
export const minutage = (secondes) => {
  if (secondes === null || secondes === undefined || Number.isNaN(Number(secondes))) return '';
  const s = Math.max(0, Math.round(Number(secondes)));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Prochain identifiant libre (« o5 ») pour une nouvelle option, paire ou élément. */
export const idLibre = (liste, prefixe) => {
  const pris = new Set(liste.map((e) => e.id));
  let n = liste.length + 1;
  while (pris.has(`${prefixe}${n}`)) n += 1;
  return `${prefixe}${n}`;
};

/** Adresse qu'ouvre le QR code d'une passation (le téléphone de l'étudiant arrive sur le quiz). */
export const lienQuiz = (code) => `${window.location.origin}/quiz/code/${code}`;

/** La question a-t-elle une réponse (vide, liste vide ou objet vide : non) ? */
export const aUneReponse = (valeur) => valeur !== undefined && valeur !== null && valeur !== '' && !(Array.isArray(valeur) && !valeur.length) && !(typeof valeur === 'object' && !Array.isArray(valeur) && !Object.keys(valeur).length);

/** Raccourci clavier 1 à 9 : la n-ième option (choix) ; rend la nouvelle valeur ou undefined. */
export const choixAuClavier = (question, valeur, chiffre) => {
  if (question.type === 'vrai_faux') return chiffre === 1 ? true : chiffre === 2 ? false : undefined;
  const option = question.options?.[chiffre - 1];
  if (!option) return undefined;
  if (question.type === 'choix_unique') return option.id;
  if (question.type === 'choix_multiple') {
    const choisies = Array.isArray(valeur) ? valeur : [];
    const suivantes = choisies.includes(option.id) ? choisies.filter((x) => x !== option.id) : [...choisies, option.id];
    return suivantes.length ? suivantes : null;
  }
  return undefined;
};
