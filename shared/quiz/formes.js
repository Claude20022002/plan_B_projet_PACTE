/**
 * Formes des réponses d'un quiz en direct (DESIGN.md, Palette de jeu) : une forme par rang, pour
 * qu'on ne reconnaisse jamais une réponse à sa seule couleur. Tracés dans une boîte de 24 × 24, les
 * mêmes au projecteur (site), sur le téléphone (application) et sur PlannerQuiz.
 */
export const TRACES_FORMES = {
  triangle: 'M12 2.8 22 20.2H2Z',
  losange: 'M12 1.8 22.2 12 12 22.2 1.8 12Z',
  cercle: 'M12 2.5a9.5 9.5 0 1 1 0 19 9.5 9.5 0 0 1 0-19Z',
  carre: 'M5 3.5h14A1.5 1.5 0 0 1 20.5 5v14a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5Z',
  etoile: 'm12 1.9 3 6.4 7 .9-5.1 4.8 1.3 6.9L12 17.5 5.8 20.9l1.3-6.9L2 9.2l7-.9Z',
  hexagone: 'M12 1.8 20.8 6.9v10.2L12 22.2 3.2 17.1V6.9Z',
};

/** Image SVG de la forme `forme` en couleur `couleur` (pour SvgXml de l'application). */
export const svgForme = (forme, couleur = 'currentColor') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${couleur}" d="${TRACES_FORMES[forme] ?? TRACES_FORMES.cercle}"/></svg>`;
