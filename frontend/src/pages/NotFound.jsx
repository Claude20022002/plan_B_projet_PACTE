import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/** Page introuvable (adresse inconnue du site). */
export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2 }}>
      <Typography variant="h1" fontWeight={900} color="primary.main" sx={{ fontSize: { xs: '5rem', sm: '8rem' }, lineHeight: 1 }}>
        404
      </Typography>
      <Typography variant="h5" color="text.secondary" fontWeight={600}>{t('notFound.titre')}</Typography>
      <Typography color="text.disabled">{t('notFound.texte')}</Typography>
      <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
        <Button variant="outlined" onClick={() => navigate(-1)}>{t('common.back')}</Button>
        <Button variant="contained" onClick={() => navigate('/')}>{t('notFound.accueil')}</Button>
      </Box>
    </Box>
  );
}
