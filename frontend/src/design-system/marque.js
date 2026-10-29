/**
 * Couleurs de l'école (D-21, lot ME-11) posées sur les jetons du site, une fois au démarrage et
 * avant le premier affichage (main.jsx). Les écrans lisent ds.brand, ds.colors… au moment de
 * s'afficher : ils prennent les couleurs de l'école sans changer une ligne. Le menu et le cadre
 * du panneau passent par des variables CSS, posées par ThemeContext à partir des mêmes jetons.
 */
import { ds } from './tokens';
import { melanger, nuancesMarque, verifierCouleur } from '../../../shared/couleurs.js';

// Couleurs livrées avec les jetons (shared/design-tokens.json) : une école qui garde exactement
// celles-ci garde aussi les nuances réglées à la main (survol, mode sombre), au pixel près
const LIVREES = { principale: ds.brand.navy, accent: ds.brand.orange };

/** Pose les couleurs de l'école sur les jetons. Sans couleurs valides, les jetons restent tels quels. */
export const appliquerMarque = ({ couleur_principale: principale, couleur_accent: accent } = {}) => {
  // Une copie ancienne ou abîmée dans le navigateur ne doit jamais rendre le site illisible
  if (!verifierCouleur(principale, 'principale').valide || !verifierCouleur(accent, 'accent').valide) return;
  const memes = principale.toUpperCase() === LIVREES.principale.toUpperCase() && accent.toUpperCase() === LIVREES.accent.toUpperCase();
  if (memes) return;

  const n = nuancesMarque({ couleur_principale: principale, couleur_accent: accent });
  Object.assign(ds.brand, { navy: n.navy, navyDeep: n.navyDeep, navySoft: n.navySoft, navyNight: n.navyNight, navyLight: n.navyLight, orange: n.orange });
  Object.assign(ds.colors.brand, { primary: n.navy, hover: n.navyDeep, soft: n.navySoft });
  Object.assign(ds.colors.info, { text: n.navy, bg: n.navySoft, border: melanger(n.navy, '#FFFFFF', 0.75) });
  ds.navBrut.fond = n.navy;
  ds.boardBrut.frame = n.frame;
  ds.document.marine = n.navy;
  if (typeof document !== 'undefined') {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', n.navy);
  }
};
