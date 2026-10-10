import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import { CheckCircle, Fullscreen, FullscreenExit } from '@mui/icons-material';
import ConfirmDialog from '../components/common/ConfirmDialog';
import VerificationSurprise from '../components/appel/VerificationSurprise';
import { presenceAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { ds } from '../design-system/tokens';

const RAFRAICHIR_LISTE_MS = 3000;
// Un étudiant qui vient de scanner reste mis en avant quelques secondes
const NOUVEAU_MS = 8000;

/**
 * Appel par QR code, écran à projeter en classe (plan espace-enseignant, lot P-1), sans le menu de
 * Planner. L'enseignant projette le QR ; chaque étudiant qui scanne voit son nom apparaître à
 * droite, ce qui lui confirme que sa présence est enregistrée ; à la fin, l'enseignant valide
 * l'appel. Rien à cocher. La vérification surprise reste facultative. Seuls les présents sont
 * affichés : ni les absents, ni les signalements. Une fois l'appel validé, le bilan s'affiche et
 * l'enseignant ouvre la liste complète (présents et absents) sur son écran d'appel.
 */
export default function AppelProjection() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [liste, setListe] = useState(null); // { seance, appel, presents, etudiants }
  const [qr, setQr] = useState(null); // { image, expire_le }
  const [erreur, setErreur] = useState('');
  const [valider, setValider] = useState(false);
  const [verification, setVerification] = useState(false);
  const [pleinEcran, setPleinEcran] = useState(false);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const minuterie = useRef(null);
  const ouvert = Boolean(liste?.appel?.ouvert);
  const termine = Boolean(liste?.appel && !liste.appel.ouvert);
  const termineRef = useRef(false);
  termineRef.current = termine;

  const chargerListe = useCallback(
    () =>
      presenceAPI
        .liste(id)
        .then((l) => {
          setListe(l);
          setMaintenant(Date.now());
          return l;
        })
        .catch((e) => {
          setErreur(e?.message || t('appel.projection.erreur'));
          return null;
        }),
    [id, t]
  );

  const dessiner = useCallback(async ({ url, expire_dans_ms }) => {
    const image = await QRCode.toDataURL(url, { errorCorrectionLevel: 'M', margin: 2, width: 1024, color: { dark: '#000000', light: '#FFFFFF' } });
    setQr({ image, expire_le: Date.now() + expire_dans_ms });
  }, []);

  // Code suivant juste avant l'expiration du courant (toutes les 30 s), sans rien afficher du délai
  const programmer = useCallback(
    (delai) => {
      clearTimeout(minuterie.current);
      minuterie.current = setTimeout(async () => {
        try {
          const code = await presenceAPI.code(id);
          await dessiner(code);
          programmer(code.expire_dans_ms + 200);
        } catch {
          // Appel terminé depuis une autre fenêtre, ou coupure : la liste dit où on en est, et
          // le code est redemandé tant que l'appel n'est pas terminé
          setQr(null);
          chargerListe();
          if (!termineRef.current) programmer(5000);
        }
      }, Math.max(500, delai));
    },
    [id, dessiner, chargerListe]
  );

  const ouvrir = useCallback(async () => {
    setErreur('');
    try {
      const r = await presenceAPI.ouvrir(id);
      setListe((l) => l && { ...l, appel: { ...l.appel, ouvert: true } });
      await dessiner(r);
      programmer(r.expire_dans_ms + 200);
      chargerListe();
    } catch (e) {
      setErreur(e?.message || t('appel.erreur'));
    }
  }, [id, dessiner, programmer, chargerListe, t]);

  // À l'arrivée : l'appel est ouvert s'il ne l'a jamais été ; un appel déjà validé n'est pas
  // rouvert par un simple rechargement de la page
  useEffect(() => {
    let actif = true;
    chargerListe().then((l) => {
      if (!actif || !l) return;
      if (!l.appel) ouvrir();
    });
    const rafraichir = setInterval(chargerListe, RAFRAICHIR_LISTE_MS);
    return () => {
      actif = false;
      clearTimeout(minuterie.current);
      clearInterval(rafraichir);
    };
  }, [chargerListe, ouvrir]);

  // L'état de l'appel commande le QR, y compris quand il change depuis une autre fenêtre :
  // terminé, plus de code ; ouvert sans code affiché, on le demande
  useEffect(() => {
    if (termine) {
      clearTimeout(minuterie.current);
      setQr(null);
    } else if (ouvert && !qr) programmer(0);
  }, [termine, ouvert, qr, programmer]);

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

  const fermer = async () => {
    setValider(false);
    try {
      const r = await presenceAPI.fermer(id);
      setListe((l) => l && { ...l, appel: { ...l.appel, ouvert: false } });
      toast.success(t('appel.termine', { count: r.presents }));
      chargerListe();
    } catch (e) {
      toast.error(e?.message || t('appel.erreur'));
    }
  };

  const seance = liste?.seance;
  const attendus = liste?.etudiants.length ?? 0;
  // Les derniers arrivés en tête : celui qui vient de scanner se trouve tout de suite
  const presents = useMemo(
    () => (liste?.etudiants ?? []).filter((e) => e.present).sort((a, b) => new Date(b.marque_le ?? 0) - new Date(a.marque_le ?? 0)),
    [liste]
  );
  const boutonSombre = { color: ds.board.letter, borderColor: ds.board.seam, '&:hover': { borderColor: ds.board.letterDim } };

  return (
    <Box component="main" sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: ds.board.ground, color: ds.board.letter }}>
      {/* Bandeau : la séance, et les commandes de l'enseignant */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, px: { xs: 2, md: 3 }, py: 1.5, borderBottom: `1px solid ${ds.board.seam}` }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography component="h1" noWrap sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(1.25rem, 3vh, 2.25rem)', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.15 }}>
            {seance?.cours ?? t('appel.titre')}
          </Typography>
          {seance && (
            <Typography noWrap sx={{ fontSize: 'clamp(0.875rem, 2vh, 1.25rem)', color: ds.board.letterDim }}>
              {[seance.groupe, `${seance.heure_debut}–${seance.heure_fin}`, seance.salle].filter(Boolean).join(' · ')}
            </Typography>
          )}
        </Box>
        {ouvert && (
          <>
            <Button variant="outlined" onClick={() => setVerification(true)} disabled={presents.length === 0} title={t('appel.verifierAide')} sx={boutonSombre}>
              {t('appel.verifier')}
            </Button>
            <Button variant="contained" startIcon={<CheckCircle />} onClick={() => setValider(true)} sx={{ bgcolor: ds.board.letter, color: ds.board.ground, '&:hover': { bgcolor: '#FFFFFF' } }}>
              {t('appel.projection.valider')}
            </Button>
          </>
        )}
        {termine && (
          <Button variant="outlined" onClick={ouvrir} sx={boutonSombre}>
            {t('appel.rouvrir')}
          </Button>
        )}
        <Button onClick={basculerPleinEcran} startIcon={pleinEcran ? <FullscreenExit /> : <Fullscreen />} sx={{ color: ds.board.letterDim }}>
          {t(pleinEcran ? 'appel.projection.quitterPleinEcran' : 'appel.projection.pleinEcran')}
        </Button>
      </Box>

      <Box sx={{ flexGrow: 1, minHeight: 0, display: 'grid', gap: { xs: 2, md: 3 }, p: { xs: 2, md: 3 }, gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(300px, 34vw)' }, alignItems: 'start' }}>
        {/* Le QR à scanner */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center' }}>
          {erreur ? (
            <Typography role="alert" sx={{ py: 6, maxWidth: 640, fontSize: 'clamp(1.125rem, 3vh, 1.75rem)' }}>{erreur}</Typography>
          ) : termine ? (
            <Box role="status" sx={{ py: 6 }}>
              <Typography sx={{ fontFamily: ds.font.board, fontSize: 'clamp(1.75rem, 5vh, 3rem)', letterSpacing: '0.08em' }}>{t('appel.ferme')}</Typography>
              <Typography sx={{ mt: 1, fontSize: 'clamp(1rem, 2.6vh, 1.5rem)', color: ds.board.letterDim }}>
                {t('appel.bilan', { presents: presents.length, absents: Math.max(0, attendus - presents.length) })}
              </Typography>
              <Button variant="outlined" onClick={() => navigate(`/appel/${id}`)} sx={{ mt: 2.5, ...boutonSombre }}>
                {t('appel.projection.listeComplete')}
              </Button>
            </Box>
          ) : qr ? (
            <>
              <Box component="img" src={qr.image} alt={t('appel.qrAlt')} sx={{ width: 'min(68dvh, 100%)', aspectRatio: '1', borderRadius: 1, bgcolor: '#FFFFFF' }} />
              <Typography sx={{ fontSize: 'clamp(1rem, 2.6vh, 1.5rem)' }}>{t('appel.projection.consigne')}</Typography>
            </>
          ) : (
            <Skeleton variant="rectangular" sx={{ width: 'min(68dvh, 100%)', height: 'auto', aspectRatio: '1', bgcolor: ds.board.cell }} />
          )}
        </Box>

        {/* Les présents : chacun vérifie que son nom est apparu */}
        <Box component="section" aria-labelledby="presents-titre" sx={{ minWidth: 0 }}>
          <Typography id="presents-titre" component="h2" aria-live="polite" sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(1.5rem, 4.5vh, 3rem)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
            {t('appel.presents', { presents: presents.length, attendus })}
          </Typography>
          {liste && presents.length === 0 && !termine && (
            <Typography sx={{ mt: 1.5, color: ds.board.letterDim }}>{t('appel.projection.aucunPresent')}</Typography>
          )}
          <Box component="ul" sx={{ listStyle: 'none', m: 0, mt: 1.5, p: 0, display: 'grid', gap: 1, gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', maxHeight: { md: 'calc(100dvh - 220px)' }, overflowY: 'auto' }}>
            {presents.map((e) => {
              const nouveau = e.marque_le && maintenant - new Date(e.marque_le).getTime() < NOUVEAU_MS;
              return (
                <Box
                  component="li"
                  key={e.id_user}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    px: 1.25,
                    py: 1,
                    borderRadius: `${ds.radius.md}px`,
                    bgcolor: ds.board.cell,
                    border: `1px solid ${nouveau ? ds.board.live : ds.board.seam}`,
                    '@keyframes arrivee': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'none' } },
                    animation: 'arrivee 300ms ease-out',
                    '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                  }}
                >
                  <CheckCircle sx={{ flexShrink: 0, color: nouveau ? ds.board.live : ds.board.letterDim }} aria-hidden />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 600, lineHeight: 1.2 }}>{e.prenom} {e.nom}</Typography>
                    <Typography noWrap sx={{ fontSize: '0.75rem', color: ds.board.letterDim }}>{t('appel.projection.present')}</Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Box>

      <VerificationSurprise id={id} ouvert={verification} fermer={() => setVerification(false)} modifie={chargerListe} />
      <ConfirmDialog
        open={valider}
        title={t('appel.projection.validerTitre')}
        message={t('appel.terminerMessage', { presents: presents.length, attendus })}
        confirmLabel={t('appel.projection.valider')}
        confirmColor="primary"
        onConfirm={fermer}
        onCancel={() => setValider(false)}
      />
    </Box>
  );
}
