import { Box } from '@mui/material';
import { TRACES_FORMES } from '../../../../shared/quiz/formes.js';

/** Forme d'une réponse (triangle, losange, cercle, carré, étoile, hexagone) en `couleur`, décorative. */
export default function Forme({ forme, taille = 24, couleur = 'currentColor' }) {
  return (
    <Box component="svg" viewBox="0 0 24 24" aria-hidden="true" sx={{ width: taille, height: taille, flexShrink: 0, display: 'block' }}>
      <path fill={couleur} d={TRACES_FORMES[forme] ?? TRACES_FORMES.cercle} />
    </Box>
  );
}
