import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { ArrowBack, CastForEducation, ReportProblemOutlined } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import ConfirmDialog from '../components/common/ConfirmDialog';
import VerificationSurprise from '../components/appel/VerificationSurprise';
import { presenceAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { ds } from '../design-system/tokens';

const RAFRAICHIR_LISTE_MS = 5000;

/**
 * Appel par QR code (I1), écran de l'enseignant : le QR à projeter, qui change toutes les 30 s
 * (un code photographié ne sert plus longtemps), les présents qui arrivent en direct, la liste
 * pour cocher à la main, et la fin de l'appel (la séance est marquée réalisée).
 * Facultatif : une vérification surprise tire quelques présents au hasard, à appeler à voix haute ;
 * un absent perd sa présence et est signalé. Les signalements (téléphone partagé…) s'affichent
 * dans la liste.
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
  const [verification, setVerification] = useState(false);
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

  const ouvrir = useCallback(async () => {
    setErreur('');
    try {
      const r = await presenceAPI.ouvrir(id);
      setSeance(r.seance);
      setFerme(false);
      setListe((l) => l && { ...l, appel: { ...l.appel, ouvert: true } });
      await dessiner(r);
      programmer(r.expire_dans_ms + 200);
    } catch (e) {
      setErreur(e?.message || t('appel.erreur'));
    }
  }, [id, dessiner, programmer, t]);

  // À l'arrivée : un appel déjà terminé s'affiche tel quel (liste complète), sans être rouvert
  useEffect(() => {
    let actif = true;
    presenceAPI
      .liste(id)
      .then((l) => {
        if (!actif) return;
        setListe(l);
        setSeance(l.seance);
        if (l.appel && !l.appel.ouvert) setFerme(true);
        else ouvrir();
      })
      .catch((e) => actif && setErreur(e?.message || t('appel.erreur')));
    const rafraichir = setInterval(chargerListe, RAFRAICHIR_LISTE_MS);
    return () => {
      actif = false;
      clearTimeout(minuterie.current);
      clearInterval(rafraichir);
    };
  }, [id, ouvrir, chargerListe, t]);

  // Appel terminé depuis l'écran projeté : cet écran suit
  const fermeAilleurs = Boolean(liste?.appel && !liste.appel.ouvert);
  useEffect(() => {
    if (!fermeAilleurs) return;
    clearTimeout(minuterie.current);
    setFerme(true);
    setQr(null);
  }, [fermeAilleurs]);

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

  // Fenêtre sans onglets ni barre de favoris, à glisser sur l'écran de la salle ; si le navigateur
  // la bloque, le lien s'ouvre dans un nouvel onglet
  const projeter = (e) => {
    const fenetre = window.open(`/appel/${id}/projection`, `projection-appel-${id}`, 'popup,width=1000,height=900');
    if (fenetre) e.preventDefault();
  };

  const libelleSignalement = (s) => t(`appel.signalement.${s.motif}`, { lie: s.lie ?? '?' });

  const attendus = liste?.etudiants.length ?? 0;
  const presents = liste?.presents ?? 0;
  // Appel terminé : la liste de la classe comparée aux présences, les absents d'abord
  const etudiants = liste?.etudiants ?? [];
  const groupes = ferme
    ? [
        { cle: 'absents', titre: t('appel.groupeAbsents', { count: etudiants.filter((e) => !e.present).length }), lignes: etudiants.filter((e) => !e.present) },
        { cle: 'presents', titre: t('appel.groupePresents', { count: etudiants.filter((e) => e.present).length }), lignes: etudiants.filter((e) => e.present) },
      ]
    : [{ cle: 'tous', titre: null, lignes: etudiants }];

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
            <Box sx={{ py: 6 }}>
              <Typography sx={{ fontFamily: ds.font.board, fontSize: '1.5rem', letterSpacing: '0.08em' }}>{t('appel.ferme')}</Typography>
              <Typography sx={{ mt: 1, color: ds.board.letterDim }}>{t('appel.bilan', { presents, absents: Math.max(0, attendus - presents) })}</Typography>
              <Button variant="outlined" onClick={ouvrir} sx={{ mt: 2, color: ds.board.letter, borderColor: ds.board.seam }}>
                {t('appel.rouvrir')}
              </Button>
            </Box>
          ) : qr ? (
            <>
              <Box component="img" src={qr.image} alt={t('appel.qrAlt')} sx={{ width: '100%', maxWidth: 520, aspectRatio: '1', borderRadius: 1, bgcolor: '#FFFFFF' }} />
              <LinearProgress variant="determinate" value={(reste / 30) * 100} sx={{ mt: 1.5, height: 6, borderRadius: 3, bgcolor: ds.board.seam, '& .MuiLinearProgress-bar': { bgcolor: ds.board.letter } }} aria-hidden />
              <Typography sx={{ mt: 1, fontSize: '0.875rem', color: ds.board.letterDim }}>{t('appel.change', { secondes: reste })}</Typography>
            </>
          ) : (
            !erreur && <Skeleton variant="rectangular" sx={{ width: '100%', aspectRatio: '1', bgcolor: ds.board.cell }} />
          )}
          {!ferme && (
            <Typography sx={{ mt: 2, fontFamily: ds.font.board, fontSize: '2.5rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }} aria-live="polite">
              {t('appel.presents', { presents, attendus })}
            </Typography>
          )}
          {/* Fenêtre à part pour l'écran de la salle : le QR seul, sans le menu ni la liste des noms */}
          {!ferme && qr && (
            <>
              <Button
                variant="outlined"
                startIcon={<CastForEducation />}
                href={`/appel/${id}/projection`}
                target="_blank"
                rel="noopener"
                onClick={projeter}
                sx={{ mt: 1.5, color: ds.board.letter, borderColor: ds.board.seam }}
              >
                {t('appel.projeter')}
              </Button>
              <Typography sx={{ mt: 1, fontSize: '0.8125rem', color: ds.board.letterDim }}>{t('appel.projeterAide')}</Typography>
            </>
          )}
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h6">{t('appel.liste')}</Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={() => setVerification(true)} disabled={!seance || presents === 0} title={t('appel.verifierAide')}>
                {t('appel.verifier')}
              </Button>
              {!ferme && (
                <Button variant="contained" onClick={() => setTerminer(true)} disabled={!seance}>
                  {t('appel.terminer')}
                </Button>
              )}
            </Stack>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{t(ferme ? 'appel.aideListeFerme' : 'appel.aideListe')}</Typography>
          {!liste && <Skeleton variant="rectangular" height={160} />}
          {liste?.etudiants.length === 0 && <Alert severity="info">{t('appel.aucunAttendu')}</Alert>}
          {groupes.map((groupe) => (
          <List key={groupe.cle} dense subheader={groupe.titre ? <ListSubheader disableSticky sx={{ px: 0, fontWeight: 700, color: 'text.primary' }}>{groupe.titre}</ListSubheader> : undefined}>
            {groupe.lignes.map((e) => (
              <ListItem key={e.id_user} disablePadding>
                <ListItemButton onClick={() => basculer(e)} dense>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Checkbox edge="start" checked={e.present} tabIndex={-1} disableRipple inputProps={{ 'aria-label': `${e.prenom} ${e.nom}` }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${e.nom} ${e.prenom}`}
                    secondary={e.present ? [t(e.source === 'manuel' ? 'appel.coche' : 'appel.scanne'), e.verifie && t('appel.verifie')].filter(Boolean).join(' · ') : null}
                  />
                  {e.signalements?.length > 0 && (
                    <Stack direction="row" spacing={0.5} sx={{ ml: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }} aria-label={t('appel.signalements')}>
                      {e.signalements.map((s) => (
                        <Chip key={`${s.motif}-${s.lie}`} size="small" color="warning" variant="outlined" icon={<ReportProblemOutlined />} label={libelleSignalement(s)} />
                      ))}
                    </Stack>
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          ))}
        </Paper>
      </Box>

      <VerificationSurprise id={id} ouvert={verification} fermer={() => setVerification(false)} modifie={chargerListe} />

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
