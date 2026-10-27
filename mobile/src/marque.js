import { tokens } from '../../shared/tokens.js';
import { melanger, nuancesMarque, verifierCouleur } from '../../shared/couleurs.js';
import { THEMES } from './theme';

/**
 * Couleurs de l'école (D-21, lot ME-11) posées sur les thèmes Planner, au lancement et avant le
 * premier écran (app/_layout.jsx) : la barre de titre, le cadre du panneau et la scène des jeux
 * prennent la couleur principale. Les thèmes StudyLib gardent les couleurs de la bibliothèque.
 * Mêmes nuances que le site (shared/couleurs.js).
 */
export const appliquerMarque = ({ couleur_principale: principale, couleur_accent: accent } = {}) => {
  // Une copie ancienne ou abîmée ne doit jamais rendre l'application illisible
  if (!verifierCouleur(principale, 'principale').valide || !verifierCouleur(accent, 'accent').valide) return;
  // Les couleurs livrées avec les jetons gardent les nuances réglées à la main
  if (principale.toUpperCase() === tokens.brand.navy.toUpperCase() && accent.toUpperCase() === tokens.brand.orange.toUpperCase()) return;

  const n = nuancesMarque({ couleur_principale: principale, couleur_accent: accent });
  const scene = { ciel: n.navy, collines: n.navyDeep, nuages: melanger(n.navy, '#FFFFFF', 0.15), arbres: n.navyDeep, texteAttenue: melanger(n.navy, '#FFFFFF', 0.8) };

  const sombre = THEMES['planner-sombre'];
  Object.assign(sombre.couleurs, { cadre: n.frame, bordCadre: n.frame });
  Object.assign(sombre.scene, scene);

  const clair = THEMES['planner-clair'];
  Object.assign(clair.couleurs, { cadre: n.navy, bordCadre: n.navy, accent: n.navy });
  Object.assign(clair.scene, scene);
};
