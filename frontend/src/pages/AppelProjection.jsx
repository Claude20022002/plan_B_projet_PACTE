import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { Box, Button, LinearProgress, Skeleton, Typography } from '@mui/material';
import { Fullscreen, FullscreenExit } from '@mui/icons-material';
import { presenceAPI } from '../services/api';
import { ds } from '../design-system/tokens';

const RAFRAICHIR_MS = 5000;

/**
 * Appel par QR code, écran à projeter en classe (plan espace-enseignant, lot P-1) : le QR, la
 * séance et le nombre de présents, sans le menu de Planner ni la liste nominative. Ouvert dans une
 * fenêtre à part depuis l'écran de l'appel, qui reste sur le poste de l'enseignant (liste à cocher,
 * fin de l'appel). La page n'ouvre ni ne ferme l'appel : elle suit son état.
 */
export default function AppelProjection() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [etat, setEtat] = useState(null); // { seance, presents, attendus }
  const [qr, setQr] = useState(null); // { code, image, expire_le }
  const [attente, setAttente] = useState(null); // 'ferme' | 'erreur'
  const [reste, setReste] = useState(30);
  const [pleinEcran, setPleinEcran] = useState(false);
  const codeAffiche = useRef(null);

  const lire = useCallback(async () => {
    try {
      const r = await presenceAPI.code(id);
      setEtat({ seance: r.seance, presents: r.presents, attendus: r.attendus });
      setAttente(null);
      // Le dessin ne change qu'avec le code (toutes les 30 s)
      if (codeAffiche.current !== r.code) {
        codeAffiche.current = r.code;
        const image = await QRCode.toDataURL(r.url, { errorCorrectionLevel: 'M', margin: 2, width: 1024, color: { dark: '#000000', light: '#FFFFFF' } });
        setQr({ image, expire_le: Date.now() + r.expire_dans_ms });
      }
    } catch (e) {
      // 409 : l'appel n'est pas ouvert, ou il est terminé ; la page reprend seule s'il est rouvert
      codeAffiche.current = null;
      setQr(null);
      setAttente(e?.status === 409 ? 'ferme' : 'erreur');
    }
  }, [id]);

  useEffect(() => {
    lire();
    const minuterie = setInterval(lire, RAFRAICHIR_MS);
    return () => clearInterval(minuterie);
  }, [lire]);

  // Secondes restantes ; le code suivant est demandé dès l'expiration, sans attendre le prochain tour
  useEffect(() => {
    if (!qr) return undefined;
    let demande = false;
    const tic = setInterval(() => {
      const secondes = Math.max(0, Math.ceil((qr.expire_le - Date.now()) / 1000));
      setReste(secondes);
      if (secondes === 0 && !demande) {
        demande = true;
        lire();
      }
    }, 250);
    return () => clearInterval(tic);
  }, [qr, lire]);

  useEffect(() => {
    const suivre = () => setPleinEcran(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', suivre);
    return () => document.removeEventListener('fullscreenchange', suivre);
  }, []);

  // L'écran de la salle ne doit pas se mettre en veille pendant l'appel (si le navigateur le permet)
  useEffect(() => {
    let verrou = null;
    const demander = async () => {
      try {
        verrou = (await navigator.wakeLock?.request('screen')) ?? null;
      } catch {
        // Refusé ou non pris en charge : l'écran suit ses réglages de veille
      }
    };
    demander();
    const reprendre = () => document.visibilityState === 'visible' && demander();
    document.addEventListener('visibilitychange', reprendre);
    return () => {
      document.removeEventListener('visibilitychange', reprendre);
      verrou?.release().catch(() => {});
    };
  }, []);

  const basculerPleinEcran = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const seance = etat?.seance;

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: { xs: 1.5, md: 2.5 },
        p: { xs: 2, md: 3 },
        bgcolor: ds.board.ground,
        color: ds.board.letter,
        textAlign: 'center',
      }}
    >
      <Button
        onClick={basculerPleinEcran}
        startIcon={pleinEcran ? <FullscreenExit /> : <Fullscreen />}
        sx={{ position: 'fixed', top: 12, right: 12, color: ds.board.letterDim, opacity: pleinEcran ? 0.35 : 1, '&:hover, &.Mui-focusVisible': { opacity: 1 } }}
      >
        {t(pleinEcran ? 'appel.projection.quitterPleinEcran' : 'appel.projection.pleinEcran')}
      </Button>

      {seance && (
        <Box>
          <Typography component="h1" sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(1.5rem, 4vh, 3rem)', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.15 }}>
            {seance.cours}
          </Typography>
          <Typography sx={{ mt: 0.5, fontSize: 'clamp(1rem, 2.4vh, 1.5rem)', color: ds.board.letterDim }}>
            {[seance.groupe, `${seance.heure_debut}–${seance.heure_fin}`, seance.salle].filter(Boolean).join(' · ')}
          </Typography>
        </Box>
      )}

      {attente ? (
        <Typography role="status" sx={{ py: 6, maxWidth: 720, fontFamily: ds.font.board, fontSize: 'clamp(1.5rem, 4vh, 2.5rem)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {t(attente === 'ferme' ? 'appel.projection.pasOuvert' : 'appel.projection.erreur')}
        </Typography>
      ) : qr ? (
        <>
          <Box component="img" src={qr.image} alt={t('appel.qrAlt')} sx={{ width: 'min(62dvh, 90vw)', aspectRatio: '1', borderRadius: 1, bgcolor: '#FFFFFF' }} />
          <Box sx={{ width: 'min(62dvh, 90vw)' }}>
            <LinearProgress variant="determinate" value={(reste / 30) * 100} sx={{ height: 6, borderRadius: 3, bgcolor: ds.board.seam, '& .MuiLinearProgress-bar': { bgcolor: ds.board.letter } }} aria-hidden />
            <Typography sx={{ mt: 0.75, fontSize: '0.9375rem', color: ds.board.letterDim }}>{t('appel.change', { secondes: reste })}</Typography>
          </Box>
          <Typography sx={{ fontSize: 'clamp(1rem, 2.6vh, 1.5rem)' }}>{t('appel.projection.consigne')}</Typography>
        </>
      ) : (
        <Skeleton variant="rectangular" sx={{ width: 'min(62dvh, 90vw)', height: 'auto', aspectRatio: '1', bgcolor: ds.board.cell }} />
      )}

      {etat && !attente && (
        <Typography sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(2rem, 6vh, 4rem)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }} aria-live="polite">
          {t('appel.presents', { presents: etat.presents, attendus: etat.attendus })}
        </Typography>
      )}
    </Box>
  );
}
