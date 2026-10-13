import { Box } from '@mui/material';
import { carteSx, titreCarteSx } from '../../design-system/cartes';
import { ds } from '../../design-system/tokens';

/**
 * Carte de liste des écrans Activités, Mes classes et Annonces (DESIGN.md, Cards) : surface claire
 * à 12 px, en-tête titré avec un complément à droite (`droite`), puis des lignes réglées.
 */
export default function Panneau({ titre, droite, children, sx, titreId, component = 'section' }) {
  return (
    <Box component={component} aria-labelledby={titre ? titreId : undefined} sx={{ ...carteSx, ...sx }}>
      {(titre || droite) && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, px: { xs: 1.5, sm: 2 }, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box component="h2" id={titreId} sx={{ ...titreCarteSx, m: 0, minWidth: 0 }}>
            {titre}
          </Box>
          {droite && <Box sx={{ flexShrink: 0, color: 'text.secondary', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{droite}</Box>}
        </Box>
      )}
      <Box>{children}</Box>
    </Box>
  );
}

/** Ligne d'une carte de liste : pastille d'état facultative (`lampe`, une couleur) | contenu | action. */
export function LignePanneau({ lampe = null, children, action, premier = false }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '18px 1fr', sm: '26px 1fr auto' },
        alignItems: 'center',
        columnGap: { xs: 1, sm: 1.5 },
        rowGap: 1,
        px: { xs: 1, sm: 1.5 },
        py: { xs: 1.25, sm: 1.5 },
        borderTop: premier ? 'none' : '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', justifySelf: 'center', bgcolor: lampe ?? 'transparent' }} />
      <Box sx={{ minWidth: 0 }}>{children}</Box>
      {action && <Box sx={{ gridColumn: { xs: '2', sm: 'auto' }, justifySelf: { xs: 'start', sm: 'end' } }}>{action}</Box>}
    </Box>
  );
}

/** Intitulé d'une ligne (nom d'un jeu, d'un module, d'une classe) : Barlow 600 en casse normale. */
export const Intitule = ({ children, sx, component = 'span' }) => (
  <Box component={component} sx={{ fontWeight: 600, lineHeight: 1.35, ...sx }}>
    {children}
  </Box>
);

/** Libellé court au-dessus d'un intitulé (état, date, catégorie) : capitales condensées, en gris. */
export const Libelle = ({ children, sx, component = 'span' }) => (
  <Box component={component} sx={{ fontFamily: ds.font.board, fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary', ...sx }}>
    {children}
  </Box>
);
