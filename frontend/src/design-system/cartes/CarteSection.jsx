import { Box, Typography } from '@mui/material';
import { carteSx, titreCarteSx } from './styles';

/**
 * Carte d'un tableau de bord (DESIGN.md, Cards) : surface blanche à 12 px, filet, ombre douce en
 * clair (aucune la nuit), en-tête titré avec une action à droite. La carte est une région nommée
 * par son titre, que les lecteurs d'écran et les parcours retrouvent (« À traiter »).
 */

/** Rend une section-carte : `titre`, `sousTitre` facultatif, `action` à droite, puis le contenu. */
export default function CarteSection({ id, titre, sousTitre, action, children, sx }) {
  return (
    <Box component="section" aria-labelledby={id} sx={{ ...carteSx, alignSelf: 'start', ...sx }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: { xs: 1.5, sm: 2 }, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography id={id} component="h2" sx={titreCarteSx}>
            {titre}
          </Typography>
          {sousTitre && <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: '0.875rem' }}>{sousTitre}</Typography>}
        </Box>
        {action && <Box sx={{ flexShrink: 0 }}>{action}</Box>}
      </Box>
      {children}
    </Box>
  );
}
