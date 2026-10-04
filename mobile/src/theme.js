import { tokens, lineColor } from '../../shared/tokens.js';

/**
 * Style « panneau intégral épuré » : sombre seul, le marine HESTIM réservé à la barre de titre
 * et au cadre, les couleurs de statut seulement pour les statuts. Valeurs : shared/design-tokens.json.
 */
export const couleurs = {
  fond: tokens.board.ground,
  cellule: tokens.board.cell,
  filet: tokens.board.seam,
  lettre: tokens.board.letter,
  lettreAttenuee: tokens.board.letterDim,
  cadre: tokens.board.frame,
  enCours: tokens.board.live,
  reporte: tokens.board.delayed,
  annule: tokens.board.cancelled,
};

/** Couleur d'un statut de séance sur le panneau */
export const couleurStatut = (statut) => tokens.status[statut]?.board ?? tokens.board.letter;

export { lineColor };

export const polices = {
  panneau: 'BarlowCondensed_600SemiBold',
  panneauGras: 'BarlowCondensed_700Bold',
  panneauMoyen: 'BarlowCondensed_500Medium',
  texte: 'Barlow_400Regular',
  texteGras: 'Barlow_600SemiBold',
};

export const rayons = tokens.radius;
export const DECALAGE_VOLET_MS = tokens.flapStepMs;

/** Zone tactile minimale (accessibilité) */
export const CIBLE_TACTILE = 48;
