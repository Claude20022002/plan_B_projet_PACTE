import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { Alert, Box, Button, Checkbox, LinearProgress, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { presenceAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { ds } from '../design-system/tokens';

const RAFRAICHIR_LISTE_MS = 5000;

/**
 * Appel par QR code (I1), écran de l'enseignant : le QR à projeter, qui change toutes les 30 s
 * (un code photographié ne sert plus longtemps), les présents qui arrivent en direct, la liste
 * pour cocher à la main, et la fin de l'appel (la séance est marquée réalisée).
 */
export default function Appel() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [seance, setSeance] = useState(null);
  const [qr, setQr] = useState(null); // { image, expire_le }
  const [liste, setListe] = useState(null);
  const [erreur, setErreur] = useState('');
  const [reste, setReste] = useState(30);
  const [terminer, setTerminer] = useState(false);
  const [ferme, setFerme] = useState(false);
  const minuterie = useRef(null);

  const dessiner = useCallback(async ({ url, expire_dans_ms }) => {
    const image = await QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 2, width: 640, color: { dark: '#000000', light: '#FFFFFF' } });
    setQr({ image, expire_le: Date.now() + expire_dans_ms });
  }, []);

  // Code suivant juste avant l'expiration du courant
  const programmer = useCallback(
    (delai) => {
      clearTimeout(minuterie.current);
      minuterie.current = setTimeout(async () => {
        try {
          const code = await presenceAPI.code(id);
          await dessiner(code);
          programmer(code.expire_dans_ms + 200);
        } catch (e) {
          setErreur(e?.message || t('appel.erreur'));
        }
      }, Math.max(500, delai));
    },
    [id, dessiner, t]
  );

  const chargerListe = useCallback(() => presenceAPI.liste(id).then(setListe).catch(() => {}), [id]);

  useEffect(() => {
    let actif = true;
    presenceAPI
      .ouvrir(id)
      .then(async (r) => {
        if (!actif) return;
        setSeance(r.seance);
        await dessiner(r);
        programmer(r.expire_dans_ms + 200);
      })
      .catch((e) => actif && setErreur(e?.message || t('appel.erreur')));
    chargerListe();
    const rafraichir = setInterval(chargerListe, RAFRAICHIR_LISTE_MS);
    return () => {
      actif = false;
      clearTimeout(minuterie.current);
      clearInterval(rafraichir);
    };
  }, [id, dessiner, programmer, chargerListe, t]);

  // Secondes restantes avant le prochain code
  useEffect(() => {
    if (!qr) return undefined;
    const tic = setInterval(() => setReste(Math.max(0, Math.ceil((qr.expire_le - Date.now()) / 1000))), 250);
    return () => clearInterval(tic);
  }, [qr]);

  const basculer = async (etudiant) => {
    try {
      await presenceAPI.marquer(id, etudiant.id_user, !etudiant.present);
      chargerListe();
    } catch (e) {
      toast.error(e?.message || t('appel.erreur'));
    }
  };

  const fermer = async () => {
    setTerminer(false);
    try {
      const r = await presenceAPI.fermer(id);
      clearTimeout(minuterie.current);
      setFerme(true);
      setQr(null);
      toast.success(t('appel.termine', { count: r.presents }));
      chargerListe();
    } catch (e) {
      toast.error(e?.message || t('appel.erreur'));
    }
  };

  const attendus = liste?.etudiants.length ?? 0;
  const presents = liste?.presents ?? 0;

  return (
    <DashboardLayout>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/mes-affectations')} sx={{ mb: 1 }}>
        {t('appel.retour')}
      </Button>
      <Typography variant="h1" component="h2" sx={{ mb: 0.5 }}>
        {t('appel.titre')}
      </Typography>
      {seance && (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {[seance.cours, `${seance.heure_debut}–${seance.heure_fin}`, seance.salle, seance.groupe].filter(Boolean).join(' · ')}
        </Typography>
      )}
      {erreur && <Alert severity="error" sx={{ mb: 2 }}>{erreur}</Alert>}

      <Box sx={{ display: 'grid', gap: 2.5, gridTemplateColumns: { xs: '1fr', md: 'minmax(320px, 560px) 1fr' }, alignItems: 'start' }}>
        <Paper sx={{ p: 2, textAlign: 'center', bgcolor: ds.board.ground, color: ds.board.letter }}>
          {ferme ? (
            <Typography sx={{ py: 8, fontFamily: ds.font.board, fontSize: '1.5rem', letterSpacing: '0.08em' }}>{t('appel.ferme')}</Typography>
          ) : qr ? (
            <>
              <Box component="img" src={qr.image} alt={t('appel.qrAlt')} sx={{ width: '100%', maxWidth: 520, aspectRatio: '1', borderRadius: 1, bgcolor: '#FFFFFF' }} />
              <LinearProgress variant="determinate" value={(reste / 30) * 100} sx={{ mt: 1.5, height: 6, borderRadius: 3, bgcolor: ds.board.seam, '& .MuiLinearProgress-bar': { bgcolor: ds.board.letter } }} aria-hidden />
              <Typography sx={{ mt: 1, fontSize: '0.875rem', color: ds.board.letterDim }}>{t('appel.change', { secondes: reste })}</Typography>
            </>
          ) : (
            !erreur && <Skeleton variant="rectangular" sx={{ width: '100%', aspectRatio: '1', bgcolor: ds.board.cell }} />
          )}
          <Typography sx={{ mt: 2, fontFamily: ds.font.board, fontSize: '2.5rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }} aria-live="polite">
            {t('appel.presents', { presents, attendus })}
          </Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6">{t('appel.liste')}</Typography>
            {!ferme && (
              <Button variant="contained" onClick={() => setTerminer(true)} disabled={!seance}>
                {t('appel.terminer')}
              </Button>
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{t('appel.aideListe')}</Typography>
          {!liste && <Skeleton variant="rectangular" height={160} />}
          {liste?.etudiants.length === 0 && <Alert severity="info">{t('appel.aucunAttendu')}</Alert>}
          <List dense>
            {(liste?.etudiants ?? []).map((e) => (
              <ListItem key={e.id_user} disablePadding>
                <ListItemButton onClick={() => basculer(e)} dense>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Checkbox edge="start" checked={e.present} tabIndex={-1} disableRipple inputProps={{ 'aria-label': `${e.prenom} ${e.nom}` }} />
                  </ListItemIcon>
                  <ListItemText primary={`${e.nom} ${e.prenom}`} secondary={e.present ? t(e.source === 'manuel' ? 'appel.coche' : 'appel.scanne') : null} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>

      <ConfirmDialog
        open={terminer}
        title={t('appel.terminerTitre')}
        message={t('appel.terminerMessage', { presents, attendus })}
        confirmLabel={t('appel.terminer')}
        confirmColor="primary"
        onConfirm={fermer}
        onCancel={() => setTerminer(false)}
      />
    </DashboardLayout>
  );
}
