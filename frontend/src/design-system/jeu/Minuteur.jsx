import { Box } from '@mui/material';
import { ds } from '../tokens';

const RAYON = 44;
const TOUR = 2 * Math.PI * RAYON;

/**
 * Minuteur en anneau (DESIGN.md, Salle de jeu) : l'anneau se vide avec le temps, les secondes au
 * centre ; il passe à l'orange sous 5 secondes. Sans durée connue (`total`), l'anneau reste plein.
 */
export default function Minuteur({ restant, total, taille = 'clamp(88px, 16vh, 160px)' }) {
  const part = total > 0 ? Math.max(0, Math.min(1, restant / total)) : 1;
  const presse = restant <= 5;
  return (
    <Box sx={{ position: 'relative', width: taille, height: taille, flexShrink: 0 }}>
      <Box component="svg" viewBox="0 0 100 100" aria-hidden="true" sx={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <Box component="circle" cx="50" cy="50" r={RAYON} sx={{ fill: 'none', stroke: (theme) => theme.palette.divider, strokeWidth: 8 }} />
        <Box
          component="circle"
          cx="50"
          cy="50"
          r={RAYON}
          sx={{
            fill: 'none',
            stroke: presse ? ds.brand.orange : (theme) => theme.palette.primary.main,
            strokeWidth: 8,
            strokeLinecap: 'round',
            strokeDasharray: TOUR,
            strokeDashoffset: TOUR * (1 - part),
            transition: 'stroke-dashoffset 1s linear, stroke 250ms ease',
          }}
        />
      </Box>
      <Box
        aria-live="off"
        sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: ds.font.board, fontWeight: 700, fontSize: `calc(${taille} * 0.38)`, fontVariantNumeric: 'tabular-nums', color: presse ? ds.brand.orange : 'text.primary' }}
      >
        {restant}
      </Box>
    </Box>
  );
}
