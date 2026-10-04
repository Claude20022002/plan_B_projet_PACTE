import tokens from './design-tokens.json';

/**
 * Jetons partagés (web et mobile) et couleur de ligne des filières.
 * Le web y ajoute son sol « bureau », ses polices CSS et ses ombres (design-system/tokens.js).
 */
export { tokens };

/**
 * Couleur de ligne stable d'une filière (même code → même couleur sur tous les écrans).
 * Hors orange, rouge et vert, réservés aux statuts.
 * @param {string|number|undefined} key - code ou identifiant de filière
 */
export const lineColor = (key) => {
  if (key === undefined || key === null || key === '') return tokens.lineUnknown;
  const text = String(key);
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return tokens.lines[hash % tokens.lines.length];
};
