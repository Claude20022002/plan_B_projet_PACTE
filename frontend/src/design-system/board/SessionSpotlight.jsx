import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ds } from '../tokens';
import { relativeTo } from '../../utils/session';
import FlapTiles from './FlapTiles';

/**
 * La séance en vedette (en cours ou prochaine), dépliée sous sa ligne du panneau :
 * la salle en très grand comme un numéro de quai, puis où, quand, avec qui.
 */
export default function SessionSpotlight({ session: s, phase, variant = 'board', actions }) {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(() => new Date());
  const isBoard = variant === 'board';

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const dim = isBoard ? ds.board.letterDim : ds.colors.text.muted;
  const text = isBoard ? ds.board.letter : ds.colors.text.primary;

  const when =
    phase === 'live'
      ? `${t('status.live')} · ${relativeTo(s.end, i18n.language, now)}`
      : relativeTo(s.start, i18n.language, now);

  const where = [s.building, s.floor !== null && s.floor !== undefined ? t('board.floor', { floor: s.floor }) : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'auto 1fr' },
        columnGap: { sm: 4 },
        rowGap: 2,
        alignItems: 'start',
        px: { xs: 2, sm: 3 },
        py: { xs: 2, sm: 2.5 },
        color: text,
      }}
    >
      <Box>
        <Box
          sx={{
            fontFamily: ds.font.board,
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: dim,
            mb: 0.75,
          }}
        >
          {t('board.room')}
        </Box>
        <FlapTiles value={s.room || '—'} variant={variant} size="clamp(2rem, 9vw, 2.75rem)" />
        {where && (
          <Box sx={{ mt: 1, fontSize: '0.9375rem', color: dim }}>{where}</Box>
        )}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Box
          sx={{
            fontFamily: ds.font.board,
            fontWeight: 700,
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: isBoard ? ds.board.live : ds.brand.green,
          }}
        >
          {when}
        </Box>
        <Box sx={{ mt: 0.5, fontSize: '1.0625rem', fontWeight: 600, lineHeight: 1.35 }}>{s.course}</Box>
        <Box sx={{ mt: 0.5, fontSize: '0.9375rem', color: dim }}>
          {[`${s.startLabel} – ${s.endLabel}`, s.durationMin ? `${s.durationMin} min` : null, s.teacher, s.group]
            .filter(Boolean)
            .join(' · ')}
        </Box>
        {s.previousLabel && (
          <Box component="del" sx={{ display: 'block', mt: 0.5, fontSize: '0.875rem', color: dim }}>
            {t('board.previously', { value: s.previousLabel })}
          </Box>
        )}
        {actions && <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>{actions}</Box>}
      </Box>
    </Box>
  );
}
