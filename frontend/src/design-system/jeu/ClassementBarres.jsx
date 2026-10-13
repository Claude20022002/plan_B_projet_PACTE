import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ds } from '../tokens';

/**
 * Classement en barres horizontales (DESIGN.md, Salle de jeu) : rang, nom, barre proportionnelle aux
 * points, points. `lignes` : [{ nom, points, couleur? }] déjà triées ; `depart` : rang de la première.
 */
export default function ClassementBarres({ lignes, depart = 1 }) {
  const { t } = useTranslation();
  const plus = Math.max(1, ...lignes.map((l) => l.points));
  return (
    <Box component="ol" start={depart} sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1 }}>
      {lignes.map((l, i) => (
        <Box component="li" key={l.nom} sx={{ display: 'grid', gridTemplateColumns: '3ch minmax(0, 14rem) minmax(0, 1fr) auto', alignItems: 'center', gap: 2 }}>
          <Typography sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(1.1rem, 3vh, 1.75rem)', color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{depart + i}</Typography>
          <Typography noWrap sx={{ fontWeight: 600, fontSize: 'clamp(1rem, 2.8vh, 1.5rem)' }}>
            {l.nom}
          </Typography>
          <Box aria-hidden="true" sx={{ height: 'clamp(14px, 2.6vh, 24px)', borderRadius: 999, bgcolor: 'action.hover', overflow: 'hidden' }}>
            <Box sx={{ width: `${(l.points / plus) * 100}%`, height: '100%', borderRadius: 999, bgcolor: l.couleur ?? 'primary.main', transition: 'width 600ms cubic-bezier(0.16, 1, 0.3, 1)' }} />
          </Box>
          <Typography sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(1.1rem, 3vh, 1.75rem)', fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
            {t('quizDirect.points', { count: l.points })}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
