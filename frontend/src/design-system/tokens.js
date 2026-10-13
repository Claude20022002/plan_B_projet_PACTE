/**
 * Design tokens — HESTIM Planner, cartes claires (DESIGN.md).
 *
 * Sol clair et cartes blanches ; mode nuit en ardoise (ds.surface.nuit), jamais en noir.
 * Les couleurs de marque sont relevées sur le logo officiel (public/HESTIM.png).
 */

import { tokens as partages, lineColor } from '../../../shared/tokens.js';

// Couleurs exactes du logo HESTIM (shared/design-tokens.json)
const brand = partages.brand;
const clair = partages.surface.clair;

// Menu sur la marine du logo
const NAV = {
  fond: brand.navy,
  letter: '#FFFFFF',
  letterSoft: '#D3DAF1',
  letterDim: '#B9C3E6',
  icon: '#8D9BCF',
  selection: 'rgba(255,255,255,0.12)',
  survol: 'rgba(255,255,255,0.07)',
  filet: 'rgba(255,255,255,0.12)',
  bordBouton: 'rgba(255,255,255,0.22)',
  boutonActif: 'rgba(255,255,255,0.14)',
};

// Le menu passe par des variables CSS : le thème StudyLib les redéfinit (design-system/familles.js)
// sans toucher aux écrans. Valeur de repli : celle de Planner.
const parVariables = (prefixe, valeurs) => Object.fromEntries(Object.entries(valeurs).map(([cle, valeur]) => [cle, `var(--${prefixe}-${cle}, ${valeur})`]));

export const ds = {
  brand,

  colors: {
    // Sol « bureau » (clair) — écrans de gestion
    bg: {
      app: clair.sol,
      surface: clair.carte,
      subtle: clair.doux,
      elevated: clair.carte,
    },
    text: {
      primary: clair.encre,
      secondary: clair.encreSeconde,
      muted: clair.encreEffacee,
    },
    border: {
      default: clair.filet,
      strong: clair.filetAppuye,
    },
    // Accent d'action : le bleu marine du logo (contraste 15:1 sur blanc)
    brand: {
      primary: brand.navy,
      hover: brand.navyDeep,
      soft: brand.navySoft,
    },
    success: { text: brand.green, bg: '#E7F4EC', border: '#A9D6BA' },
    warning: { text: '#B4410C', bg: '#FDEFE7', border: '#F7C2A5' },
    danger: { text: '#B5161C', bg: '#FCE8E9', border: '#F2B4B6' },
    info: { text: brand.navy, bg: brand.navySoft, border: '#BCC6E6' },
  },

  // Sols, cartes et textes en clair et en nuit (shared/design-tokens.json)
  surface: partages.surface,

  // Salle de jeu des quiz : couleur, encre et forme de chaque réponse, couleurs d'équipe
  jeu: partages.jeu,

  // Blanc pur : surfaces sur la marine (plaque du logo, avatar)
  white: '#FFFFFF',

  // Menu et en-têtes sur la marine du logo (DashboardLayout, Accueil, Connexion)
  nav: parVariables('nav', NAV),
  navBrut: NAV,

  // Emploi du temps officiel imprimé (EDT du mois, format A4 de HESTIM) : les couleurs du
  // document papier de l'école, distinctes de celles de l'écran
  document: {
    fond: '#FFFFFF',
    encre: '#000000',
    rouge: '#C00000',
    marine: brand.navy,
    orange: '#F8CBAD',
    orangeTexte: '#843C0C',
    vide: '#F2F2F2',
    evenement: '#DDEBF7',
    bord: '#7F7F7F',
  },

  // Commun au web et au mobile (shared/design-tokens.json)
  status: partages.status,

  // Couleur de ligne par filière (shared/design-tokens.json) ; orange, rouge et vert sont réservés aux statuts
  lines: partages.lines,
  lineUnknown: partages.lineUnknown,

  font: {
    // Une seule famille : Barlow (signalétique) — condensée pour le panneau et les en-têtes
    board: '"Barlow Condensed", "Arial Narrow", sans-serif',
    body: '"Barlow", "Segoe UI", system-ui, sans-serif',
    // Terminal des jeux : la seule exception à Barlow, un terminal se lit à chasse fixe
    mono: 'ui-monospace, "Cascadia Mono", "Segoe UI Mono", Consolas, "Liberation Mono", monospace',
  },

  // Angles doux : pastilles 6, boutons et champs 8, cartes 12, dialogues et tuiles de jeu 16
  radius: {
    xs: 6,
    sm: partages.rayon.petit,
    md: partages.rayon.moyen,
    lg: partages.rayon.grand,
  },

  shadow: {
    card: partages.ombre.carte,
    raised: partages.ombre.releve,
    popover: partages.ombre.flottant,
  },

  motion: {
    fast: 0.12,
    normal: 0.18,
    slow: 0.28,
    ease: [0.16, 1, 0.3, 1],
    flapStepMs: 28, // décalage entre deux caractères dans la cascade des volets
  },
};

// Couleur de ligne stable d'une filière : partagée avec le mobile
export { lineColor };
