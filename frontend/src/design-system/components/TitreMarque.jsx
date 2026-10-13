import { Box } from '@mui/material';
import { ds } from '../tokens';

/**
 * Titre de marque « HESTIM PLANNER » en capitales condensées (DESIGN.md, Display) : HESTIM à l'encre
 * (ou en `couleur`), PLANNER en orange HESTIM. `taille` est une taille CSS ; `enLigne` met les deux
 * mots sur une ligne (bandeau du téléphone).
 */
export default function TitreMarque({ taille = 'clamp(2.5rem, 8vw, 5rem)', couleur = 'text.primary', enLigne = false }) {
  const mot = { display: enLigne ? 'inline' : 'block', fontFamily: ds.font.board, fontWeight: 700, fontSize: taille, lineHeight: 1, letterSpacing: '0.06em' };
  return (
    <>
      <Box component="span" sx={{ ...mot, color: couleur }}>
        HESTIM
      </Box>
      {enLigne ? ' ' : null}
      <Box component="span" sx={{ ...mot, color: ds.brand.orange, mt: enLigne ? 0 : 0.5 }}>
        PLANNER
      </Box>
    </>
  );
}
