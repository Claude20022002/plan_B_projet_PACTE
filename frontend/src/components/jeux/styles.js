import { ds } from '../../design-system/tokens';

/** Bouton signalétique sur le noir du panneau (blanc cassé, bordure de filet) */
export const boutonPanneau = {
  color: ds.board.letter,
  borderColor: ds.board.seam,
  fontFamily: ds.font.board,
  letterSpacing: '0.08em',
  '&:hover': { borderColor: ds.board.letterDim, bgcolor: 'rgba(255,255,255,0.05)' },
  '&.Mui-focusVisible': { outline: `2px solid ${ds.brand.orange}`, outlineOffset: 2 },
};

/** Bouton principal sur le panneau : plein blanc cassé, lettres noires */
export const boutonPanneauPlein = {
  bgcolor: ds.board.letter,
  color: ds.board.ground,
  fontFamily: ds.font.board,
  letterSpacing: '0.08em',
  '&:hover': { bgcolor: '#FFFFFF' },
  '&.Mui-focusVisible': { outline: `2px solid ${ds.brand.orange}`, outlineOffset: 2 },
};
