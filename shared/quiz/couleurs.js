import tokens from '../design-tokens.json';

/**
 * Couleur, encre et forme de chaque réponse d'un quiz en direct, dans l'ordre des réponses
 * (DESIGN.md, Palette de jeu ; shared/design-tokens.json, `jeu.reponses`). Les mêmes au projecteur
 * (site) et sur le téléphone (application), pour que l'étudiant retrouve d'un coup d'œil la réponse
 * qu'il vise.
 */
export const REPONSES = tokens.jeu.reponses;

/** Couleurs seules des réponses, dans l'ordre. */
export const COULEURS_REPONSES = REPONSES.map((r) => r.couleur);

const ENCRE_SOMBRE = '#0D1326';
const ENCRE_CLAIRE = '#FFFFFF';

/** Encre lisible sur `couleur` (#rrggbb) : sombre sur une couleur claire, blanche sinon. */
export const encrePour = (couleur) => {
  const hex = /^#([0-9a-f]{6})$/i.exec(String(couleur ?? '').trim());
  if (!hex) return ENCRE_CLAIRE;
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex[1].slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? ENCRE_SOMBRE : ENCRE_CLAIRE;
};

// Couleurs par défaut que l'éditeur de ClassQuiz enregistrait dans chaque réponse avant la palette
// de jeu (anciennes couleurs de ligne) : ce n'étaient pas des choix de l'enseignant
const ANCIENNES_COULEURS_PAR_DEFAUT = new Set(['#3b63e0', '#0f8a7e', '#7048c9', '#b03a8c']);

/**
 * Style de la réponse de rang `rang` : { couleur, encre, forme }. Une couleur choisie dans l'éditeur
 * du quiz (champ `color` d'une réponse ClassQuiz) l'emporte, comme sur le téléphone, sauf les
 * anciennes couleurs par défaut ; la forme suit toujours le rang.
 */
export const styleReponse = (rang, couleurChoisie) => {
  const base = REPONSES[rang % REPONSES.length];
  if (!couleurChoisie || ANCIENNES_COULEURS_PAR_DEFAUT.has(String(couleurChoisie).trim().toLowerCase())) return base;
  return { ...base, couleur: couleurChoisie, encre: encrePour(couleurChoisie) };
};
