import { Box } from '@mui/material';
import { ds } from '../../design-system/tokens';

/**
 * Panneau des jeux : même matière que le panneau des départs (cadre bleu marine, noir mat,
 * titre en capitales condensées dans le cadre), pour les listes et le terminal.
 */
export default function Panneau({ titre, droite, children, sx, titreId, component = 'section' }) {
  return (
    <Box
      component={component}
      aria-labelledby={titre ? titreId : undefined}
      sx={{ bgcolor: ds.board.frame, p: { xs: '6px', sm: '8px' }, borderRadius: `${ds.radius.lg}px`, overflow: 'hidden', ...sx }}
    >
      {(titre || droite) && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 2,
            px: { xs: 1, sm: 1.5 },
            pt: 0.5,
            pb: 1,
            color: '#FFFFFF',
            fontFamily: ds.font.board,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontSize: { xs: '1rem', sm: '1.125rem' },
          }}
        >
          <Box component="h2" id={titreId} sx={{ m: 0, font: 'inherit', letterSpacing: 'inherit', minWidth: 0 }}>
            {titre}
          </Box>
          {droite && <Box sx={{ fontSize: '0.875rem', letterSpacing: '0.08em', opacity: 0.9, flexShrink: 0 }}>{droite}</Box>}
        </Box>
      )}
      <Box sx={{ bgcolor: ds.board.ground, color: ds.board.letter, borderRadius: `${ds.radius.md}px` }}>{children}</Box>
    </Box>
  );
}

/** Ligne de panneau : lampe | contenu | action, séparée par un filet. */
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
        borderTop: premier ? 'none' : `1px solid ${ds.board.seam}`,
      }}
    >
      <Box aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', justifySelf: 'center', bgcolor: lampe ?? 'transparent' }} />
      <Box sx={{ minWidth: 0 }}>{children}</Box>
      {action && <Box sx={{ gridColumn: { xs: '2', sm: 'auto' }, justifySelf: { xs: 'start', sm: 'end' } }}>{action}</Box>}
    </Box>
  );
}

/** Texte en capitales condensées, comme une colonne du panneau */
export const Capitales = ({ children, sx, component = 'span' }) => (
  <Box component={component} sx={{ fontFamily: ds.font.board, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', ...sx }}>
    {children}
  </Box>
);
