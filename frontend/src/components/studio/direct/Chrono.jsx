import { useTranslation } from 'react-i18next';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Chrono d'une question en direct : un anneau qui se vide et les secondes au centre, en orange
 * sous les cinq dernières secondes. Les lecteurs d'écran lisent le temps restant à la demande
 * (pas d'annonce chaque seconde).
 */
export default function Chrono({ restant, duree, taille = 96 }) {
  const { t } = useTranslation();
  if (restant === null || restant === undefined) return null;
  const fin = restant <= 5;
  return (
    <Box role="timer" aria-label={t('direct.chrono', { n: restant })} sx={{ position: 'relative', display: 'inline-flex', width: taille, height: taille }}>
      <CircularProgress variant="determinate" value={duree ? (restant / duree) * 100 : 0} size={taille} thickness={4} color={fin ? 'warning' : 'primary'} />
      <Typography
        component="span"
        aria-hidden
        sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: taille / 2.6, fontVariantNumeric: 'tabular-nums', color: fin ? 'warning.main' : 'text.primary' }}
      >
        {restant}
      </Typography>
    </Box>
  );
}
