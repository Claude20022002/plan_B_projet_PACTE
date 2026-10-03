import { Box } from '@mui/material';
import { ds } from '../tokens';

/**
 * Pastille d'état du bureau (hors statuts de séance, qui passent par StatusFlap) :
 * petit volet clair, angles de 2 px, capitales condensées. Les teintes viennent des
 * valeurs « bureau » des états (DESIGN.md, The Two Grounds Rule).
 *   neutral : état ordinaire · success : confirmé / disponible · warning : à confirmer / modifié
 *   danger : bloquant / indisponible · info : information (marine voilé)
 */
const TONES = {
  neutral: { color: ds.colors.text.secondary, bg: ds.colors.bg.subtle },
  success: { color: ds.colors.success.text, bg: ds.colors.success.bg },
  warning: { color: ds.colors.warning.text, bg: ds.colors.warning.bg },
  danger: { color: ds.colors.danger.text, bg: ds.colors.danger.bg },
  info: { color: ds.colors.info.text, bg: ds.colors.info.bg },
};

export default function StateChip({ tone = 'neutral', children, title }) {
  const { color, bg } = TONES[tone] || TONES.neutral;
  return (
    <Box
      component="span"
      title={title}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 24,
        px: 1,
        borderRadius: `${ds.radius.xs}px`,
        bgcolor: bg,
        color,
        fontFamily: ds.font.board,
        fontWeight: 600,
        fontSize: '0.75rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        lineHeight: 1.2,
      }}
    >
      {children}
    </Box>
  );
}
