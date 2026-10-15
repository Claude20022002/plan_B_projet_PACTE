import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, ButtonBase, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, Stack, Tab, Tabs, TextField, Typography } from '@mui/material';
import { Audiotrack, Movie, RecordVoiceOver, UploadFile } from '@mui/icons-material';
import { studioAPI } from '../../../services/studioApi';
import { tailleLisible } from '../../../utils/fichiers';
import { useToast } from '../../../contexts/ToastContext';

/**
 * Choisir le média d'une question : parmi ses médias, en déposant un fichier (glisser-déposer ou
 * bouton), ou en faisant lire un texte par la voix de synthèse. `types` limite les natures
 * proposées (une zone sur image n'accepte qu'une image).
 */

const ACCEPT = { image: 'image/png,image/jpeg,image/webp,image/gif', audio: 'audio/mpeg,audio/ogg,audio/wav,audio/mp4,audio/x-m4a,audio/webm', video: 'video/mp4,video/webm' };

/** Durée d'un audio ou d'une vidéo, lue par le navigateur avant l'envoi (null si illisible). */
const dureeDe = (fichier) =>
  new Promise((resoudre) => {
    if (!/^(audio|video)\//.test(fichier.type)) return resoudre(null);
    const el = document.createElement(fichier.type.startsWith('video') ? 'video' : 'audio');
    const url = URL.createObjectURL(fichier);
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resoudre(Number.isFinite(el.duration) ? el.duration : null);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resoudre(null);
    };
    el.src = url;
  });

function Vignette({ media, onClick }) {
  const { t } = useTranslation();
  return (
    <ButtonBase onClick={onClick} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', border: 1, borderColor: 'divider', borderRadius: 2, overflow: 'hidden', textAlign: 'left', '&:hover, &.Mui-focusVisible': { borderColor: 'primary.main' } }}>
      <Box sx={{ height: 96, display: 'grid', placeItems: 'center', bgcolor: 'action.hover' }}>
        {media.type === 'image' ? <Box component="img" src={studioAPI.urlMedia(media.id_media)} alt="" loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : media.type === 'audio' ? <Audiotrack color="action" fontSize="large" /> : <Movie color="action" fontSize="large" />}
      </Box>
      <Box sx={{ p: 1 }}>
        <Typography variant="body2" noWrap title={media.nom}>
          {media.nom}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t(`studio.media.types.${media.type}`)} · {tailleLisible(media.taille)}
        </Typography>
      </Box>
    </ButtonBase>
  );
}

export default function ChoixMediaDialog({ ouvert, onFermer, onChoisir, types = ['image', 'audio', 'video'], voixDisponible = false }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [onglet, setOnglet] = useState('bibliotheque');
  const [medias, setMedias] = useState(null);
  const [espace, setEspace] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const [survol, setSurvol] = useState(false);
  const [texteVoix, setTexteVoix] = useState('');
  const [erreur, setErreur] = useState(null);
  const champ = useRef(null);

  // Clé stable : le tableau `types` est recréé à chaque rendu du parent
  const cleTypes = types.join(',');
  const charger = useCallback(async () => {
    const r = await studioAPI.medias();
    setMedias(r.medias.filter((m) => cleTypes.split(',').includes(m.type)));
    setEspace({ utilise: r.utilise, quota: r.quota });
  }, [cleTypes]);

  useEffect(() => {
    if (ouvert) {
      setErreur(null);
      charger().catch((e) => setErreur(e.message));
    }
  }, [ouvert, charger]);

  const deposer = async (fichier) => {
    if (!fichier) return;
    setEnvoi(true);
    setErreur(null);
    try {
      const media = await studioAPI.deposerMedia(fichier, { duree: await dureeDe(fichier) });
      toast.success(t('studio.media.deposeOk'));
      onChoisir(media);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoi(false);
    }
  };

  const creerVoix = async () => {
    setEnvoi(true);
    setErreur(null);
    try {
      onChoisir(await studioAPI.voix(texteVoix));
      setTexteVoix('');
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Dialog open={ouvert} onClose={onFermer} maxWidth="md" fullWidth>
      <DialogTitle>{t('studio.media.ajouter')}</DialogTitle>
      <Tabs value={onglet} onChange={(_, v) => setOnglet(v)} variant="scrollable" sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="bibliotheque" label={t('studio.media.bibliotheque')} />
        <Tab value="depot" label={t('studio.media.deposer')} />
        {voixDisponible && types.includes('audio') && <Tab value="voix" label={t('studio.media.voix')} icon={<RecordVoiceOver fontSize="small" />} iconPosition="start" />}
      </Tabs>
      <DialogContent sx={{ minHeight: 320 }}>
        {erreur && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {erreur}
          </Alert>
        )}
        {envoi && <LinearProgress sx={{ mb: 2 }} />}
        {onglet === 'bibliotheque' &&
          (medias === null ? (
            <CircularProgress aria-label={t('common.loading')} />
          ) : medias.length === 0 ? (
            <Typography color="text.secondary">{t('studio.media.aucun')}</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1.5 }}>
              {medias.map((m) => (
                <Vignette key={m.id_media} media={m} onClick={() => onChoisir(m)} />
              ))}
            </Box>
          ))}
        {onglet === 'depot' && (
          <Box
            onDragOver={(e) => {
              e.preventDefault();
              setSurvol(true);
            }}
            onDragLeave={() => setSurvol(false)}
            onDrop={(e) => {
              e.preventDefault();
              setSurvol(false);
              deposer(e.dataTransfer.files?.[0]);
            }}
            sx={{ border: 2, borderStyle: 'dashed', borderColor: survol ? 'primary.main' : 'divider', borderRadius: 3, p: 5, textAlign: 'center', bgcolor: survol ? 'action.hover' : 'transparent' }}
          >
            <UploadFile color="action" sx={{ fontSize: 48 }} />
            <Typography sx={{ mt: 1, mb: 2 }}>{t('studio.media.deposerAide')}</Typography>
            <Button variant="contained" onClick={() => champ.current?.click()} disabled={envoi}>
              {t('studio.media.choisir')}
            </Button>
            <input ref={champ} type="file" hidden accept={types.map((x) => ACCEPT[x]).join(',')} onChange={(e) => deposer(e.target.files?.[0])} />
          </Box>
        )}
        {onglet === 'voix' && (
          <Stack spacing={2}>
            <TextField label={t('studio.media.voixTexte')} multiline minRows={5} value={texteVoix} onChange={(e) => setTexteVoix(e.target.value)} inputProps={{ maxLength: 4000 }} helperText={`${texteVoix.length} / 4000`} />
            <Box>
              <Button variant="contained" onClick={creerVoix} disabled={envoi || texteVoix.trim().length < 2} startIcon={<RecordVoiceOver />}>
                {t('studio.media.voixCreer')}
              </Button>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between', px: 3 }}>
        <Typography variant="caption" color="text.secondary">
          {espace && t('studio.media.espace', { utilise: tailleLisible(espace.utilise || 1), quota: tailleLisible(espace.quota) })}
        </Typography>
        <Button onClick={onFermer}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
}
