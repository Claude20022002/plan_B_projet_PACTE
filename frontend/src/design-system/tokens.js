/**
 * Design tokens — HESTIM Planner « panneau à volets ».
 *
 * Deux sols pour un même système :
 *   - board  : le panneau des départs (noir mat, lettres blanches) pour les séances en direct ;
 *   - bureau : la version claire pour les écrans de gestion denses.
 * Les couleurs de marque sont relevées sur le logo officiel (public/HESTIM.png).
 */

import { tokens as partages, lineColor } from '../../../shared/tokens.js';

// Couleurs exactes du logo HESTIM (shared/design-tokens.json)
const brand = partages.brand;

export const ds = {
  brand,

  colors: {
    // Sol « bureau » (clair) — écrans de gestion
    bg: {
      app: '#F3F4F7',
      surface: '#FFFFFF',
      subtle: '#EEF0F5',
      elevated: '#FFFFFF',
    },
    text: {
      primary: '#0D1326',
      secondary: '#3F4759',
      muted: '#5F6778',
    },
    border: {
      default: '#DADDE5',
      strong: '#B9BECB',
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

  // Commun au web et au mobile (shared/design-tokens.json)
  board: partages.board,

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

  radius: {
    xs: 2,
    sm: 3,
    md: 4,
    lg: 6,
  },

  shadow: {
    card: '0 1px 2px rgba(13, 19, 38, 0.06)',
    popover: '0 12px 32px rgba(13, 19, 38, 0.18)',
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
