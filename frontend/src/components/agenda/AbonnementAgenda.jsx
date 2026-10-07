import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Paper, Skeleton, Stack, TextField, Typography } from '@mui/material';
import { ContentCopy, EventAvailable, Refresh } from '@mui/icons-material';
import ConfirmDialog from '../common/ConfirmDialog';
import { agendaAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

/**
 * « Mon agenda » (R4) : l'adresse secrète du flux ICS personnel, à ajouter une fois dans Google
 * Agenda, Outlook ou le calendrier du téléphone. Reports et annulations s'y mettent à jour seuls.
 */
export default function AbonnementAgenda() {
  const { t } = useTranslation();
  const toast = useToast();
  const [abonnement, setAbonnement] = useState(null);
  const [erreur, setErreur] = useState(false);
  const [renouveler, setRenouveler] = useState(false);

  useEffect(() => {
    agendaAPI.abonnement().then(setAbonnement).catch(() => setErreur(true));
  }, []);

  const adresse = abonnement ? `${window.location.origin}${abonnement.chemin}` : '';
  const webcal = adresse.replace(/^https?:/, 'webcal:');
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(adresse);
      toast.success(t('agenda.copiee'));
    } catch {
      toast.error(t('agenda.copieImpossible'));
    }
  };

  const confirmerRenouvellement = async () => {
    setRenouveler(false);
    try {
      setAbonnement(await agendaAPI.renouveler());
      toast.success(t('agenda.renouvelee'));
    } catch (e) {
      toast.error(e?.message || t('agenda.erreur'));
    }
  };

  return (
    <Paper sx={{ p: 3, mt: 2 }} component="section" aria-labelledby="agenda-titre">
      <Typography id="agenda-titre" variant="h6" gutterBottom>
        {t('agenda.titre')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
        {t('agenda.intro')}
      </Typography>
      {erreur && <Alert severity="warning">{t('agenda.erreur')}</Alert>}
      {!abonnement && !erreur && <Skeleton variant="rectangular" height={56} />}
      {abonnement && (
        <Stack spacing={2}>
          <TextField label={t('agenda.adresse')} value={adresse} InputProps={{ readOnly: true }} onFocus={(e) => e.target.select()} fullWidth size="small" />
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<EventAvailable />} href={google} target="_blank" rel="noopener noreferrer">
              {t('agenda.google')}
            </Button>
            <Button variant="outlined" href={webcal}>
              {t('agenda.appareil')}
            </Button>
            <Button variant="outlined" startIcon={<ContentCopy />} onClick={copier}>
              {t('agenda.copier')}
            </Button>
            <Button color="inherit" startIcon={<Refresh />} onClick={() => setRenouveler(true)}>
              {t('agenda.renouveler')}
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary">{t('agenda.secret')}</Typography>
        </Stack>
      )}
      <ConfirmDialog
        open={renouveler}
        title={t('agenda.renouvelerTitre')}
        message={t('agenda.renouvelerMessage')}
        confirmLabel={t('agenda.renouveler')}
        confirmColor="warning"
        onConfirm={confirmerRenouvellement}
        onCancel={() => setRenouveler(false)}
      />
    </Paper>
  );
}
