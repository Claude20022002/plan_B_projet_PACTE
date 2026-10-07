import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Paper, Typography } from '@mui/material';
import { QrCodeScanner } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';

/**
 * /presence?c=… : adresse contenue dans le QR de l'appel (I1). La présence ne s'enregistre plus
 * depuis le site (un compte prêté, ouvert dans un navigateur, pourrait pointer pour un absent) :
 * la page explique comment scanner avec l'application, liée au téléphone de l'étudiant.
 */
export default function Presence() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <Paper sx={{ p: { xs: 3, sm: 5 }, maxWidth: 560, mx: 'auto', textAlign: 'center' }}>
        <QrCodeScanner color="primary" sx={{ fontSize: 72 }} aria-hidden />
        <Typography variant="h5" component="h2" sx={{ mt: 1 }}>
          {t('presence.titre')}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1.5 }}>
          {t('presence.consigne')}
        </Typography>
        <Button sx={{ mt: 3 }} variant="outlined" onClick={() => navigate('/')}>
          {t('presence.retour')}
        </Button>
      </Paper>
    </DashboardLayout>
  );
}
