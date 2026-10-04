/**
 * Design tokens — HESTIM Planner « panneau à volets ».
 *
 * Deux sols pour un même système :
 *   - board  : le panneau des départs (noir mat, lettres blanches) pour les séances en direct ;
 *   - bureau : la version claire pour les écrans de gestion denses.
 * Les couleurs de marque sont relevées sur le logo officiel (public/HESTIM.png).
 */

// Couleurs exactes du logo HESTIM
const brand = {
  navy: '#001861',
  navyDeep: '#000E3D',
  navySoft: '#E8ECF7',
  red: '#DB1F26',
  orange: '#F26322',
  green: '#137D3F',
};

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

  // Sol « panneau » (sombre) — séances en direct, accueil, connexion
  board: {
    ground: '#0B0B0D', // noir mat neutre (volets)
    frame: brand.navy, // cadre : bleu marine HESTIM (remplace l'acier)
    cell: '#212124', // face d'un volet, nettement détachée du fond
    cellHinge: '#000000', // charnière horizontale au milieu du volet
    seam: '#2C2C30', // filet d'un pixel entre colonnes
    letter: '#F2F1EC', // lettres blanc cassé
    letterDim: '#A6A6AC', // en-têtes de colonnes, libellés (contraste ≥ 7:1 sur le fond)
    // États lisibles sur le panneau (contraste ≥ 4.5:1 sur ground)
    onTime: '#F2F1EC',
    live: '#3FCB74', // lampe « en cours / prochaine » (vert logo éclairci)
    delayed: brand.orange, // reporté / modifié
    cancelled: '#FF5A5F', // annulé (rouge logo éclairci)
  },

  // Statuts métier : une seule source de vérité pour toutes les vues
  status: {
    planifie: { key: 'planifie', board: '#F2F1EC', bureau: '#3F4759', bureauBg: '#EEF0F5' },
    confirme: { key: 'confirme', board: '#3FCB74', bureau: brand.green, bureauBg: '#E7F4EC' },
    reporte: { key: 'reporte', board: brand.orange, bureau: '#B4410C', bureauBg: '#FDEFE7' },
    annule: { key: 'annule', board: '#FF5A5F', bureau: '#B5161C', bureauBg: '#FCE8E9' },
    // Séance faite : état normal d'une séance passée, en teinte atténuée (pas une exception)
    realise: { key: 'realise', board: '#A6A6AC', bureau: '#5B6272', bureauBg: '#F1F2F5' },
  },

  // Couleur de ligne par filière : identique partout (panneau, calendrier, graphiques).
  // Hors orange/rouge/vert, réservés aux statuts.
  lines: ['#3B63E0', '#1592C9', '#0F8A7E', '#7048C9', '#B03A8C', '#46508F'],
  // Filière inconnue : gris neutre, jamais attribué à une vraie filière
  lineUnknown: '#6B6B72',

  font: {
    // Une seule famille : Barlow (signalétique) — condensée pour le panneau et les en-têtes
    board: '"Barlow Condensed", "Arial Narrow", sans-serif',
    body: '"Barlow", "Segoe UI", system-ui, sans-serif',
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

/**
 * Couleur de ligne stable d'une filière (même code → même couleur sur tous les écrans).
 * @param {string|number|undefined} key - code ou identifiant de filière
 */
export const lineColor = (key) => {
  if (key === undefined || key === null || key === '') return ds.lineUnknown;
  const text = String(key);
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return ds.lines[hash % ds.lines.length];
};
