import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { presenceAPI } from '../services/api';

/**
 * /presence?c=… : adresse contenue dans le QR de l'appel (I1). Scanné avec l'appareil photo du
 * téléphone, il ouvre cette page ; l'étudiant connecté y est marqué présent aussitôt.
 */
export default function Presence() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [etat, setEtat] = useState({ chargement: true });
  const envoye = useRef(false);

  useEffect(() => {
    if (envoye.current) return;
    envoye.current = true;
    const code = params.get('c');
    if (!code) {
      setEtat({ erreur: t('presence.sansCode') });
      return;
    }
    presenceAPI
      .scanner(code)
      .then((r) => setEtat({ ok: r }))
      .catch((e) => setEtat({ erreur: e?.message || t('presence.erreur') }));
  }, [params, t]);

  return (
    <DashboardLayout>
      <Paper sx={{ p: { xs: 3, sm: 5 }, maxWidth: 560, mx: 'auto', textAlign: 'center' }}>
        {etat.chargement && (
          <Box sx={{ py: 4 }}>
            <CircularProgress aria-label={t('presence.enCours')} />
            <Typography sx={{ mt: 2 }}>{t('presence.enCours')}</Typography>
          </Box>
        )}
        {etat.ok && (
          <>
            <CheckCircle color="success" sx={{ fontSize: 72 }} aria-hidden />
            <Typography variant="h5" component="h2" sx={{ mt: 1 }}>
              {t(etat.ok.deja ? 'presence.deja' : 'presence.ok')}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {[etat.ok.seance.cours, `${etat.ok.seance.heure_debut}–${etat.ok.seance.heure_fin}`, etat.ok.seance.salle].filter(Boolean).join(' · ')}
            </Typography>
          </>
        )}
        {etat.erreur && <Alert severity="warning" sx={{ textAlign: 'left' }}>{etat.erreur}</Alert>}
        {!etat.chargement && (
          <Button sx={{ mt: 3 }} variant="outlined" onClick={() => navigate('/')}>
            {t('presence.retour')}
          </Button>
        )}
      </Paper>
    </DashboardLayout>
  );
}
