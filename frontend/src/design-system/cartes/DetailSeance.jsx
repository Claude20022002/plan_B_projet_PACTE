import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ds } from '../tokens';
import { relativeTo } from '../../utils/session';
import SupportsCours from './SupportsCours';

/**
 * Détail d'une séance : la salle en grand à gauche, puis quand, quoi, avec qui, et les actions.
 * Corps de la carte « Prochaine séance » et du dialogue d'une séance de l'emploi du temps.
 * `phase` « live » affiche l'heure de fin ; sinon, le temps qui reste avant le début.
 */
export default function DetailSeance({ session: s, phase, actions }) {
  const { t, i18n } = useTranslation();
  const [maintenant, setMaintenant] = useState(() => new Date());

  useEffect(() => {
    const minuterie = setInterval(() => setMaintenant(new Date()), 30000);
    return () => clearInterval(minuterie);
  }, []);

  const quand = phase === 'live' ? t('board.endsAt', { heure: s.endLabel }) : relativeTo(s.start, i18n.language, maintenant);
  const ou = [s.building, s.floor !== null && s.floor !== undefined ? t('board.floor', { floor: s.floor }) : null].filter(Boolean).join(' · ');

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'minmax(160px, auto) 1fr' }, columnGap: { sm: 4 }, rowGap: 2, alignItems: 'start' }}>
      <Box sx={{ p: 2, borderRadius: `${ds.radius.md}px`, bgcolor: 'action.hover' }}>
        <Box sx={{ fontFamily: ds.font.board, fontWeight: 600, fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary' }}>
          {t('board.room')}
        </Box>
        <Box sx={{ mt: 0.25, fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(2rem, 6vw, 3rem)', lineHeight: 1.05, letterSpacing: '0.02em', wordBreak: 'break-word' }}>
          {s.room || '-'}
        </Box>
        {ou && <Box sx={{ mt: 0.5, fontSize: '0.9375rem', color: 'text.secondary' }}>{ou}</Box>}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: { xs: '1.25rem', sm: '1.5rem' }, color: 'success.main', '&::first-letter': { textTransform: 'uppercase' } }}>{quand}</Box>
        <Box sx={{ mt: 0.5, fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.35 }}>{s.course}</Box>
        <Box sx={{ mt: 0.5, fontSize: '0.9375rem', color: 'text.secondary' }}>
          {[`${s.startLabel} – ${s.endLabel}`, s.durationMin ? `${s.durationMin} min` : null, s.teacher, s.group].filter(Boolean).join(' · ')}
        </Box>
        {s.previousLabel && (
          <Box component="del" sx={{ display: 'block', mt: 0.5, fontSize: '0.875rem', color: 'text.secondary' }}>
            {t('board.previously', { value: s.previousLabel })}
          </Box>
        )}
        <SupportsCours code={s.courseCode} color="primary.main" />
        {actions && <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>{actions}</Box>}
      </Box>
    </Box>
  );
}
