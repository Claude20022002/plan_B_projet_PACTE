import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, ButtonBase, Dialog, IconButton, Paper, Stack, Typography } from '@mui/material';
import { Close, Replay } from '@mui/icons-material';
import { minutage } from './outils';

/**
 * Média d'une question (le « Refer to the exhibit » de l'examen Cisco) : image agrandissable,
 * audio ou vidéo limités à l'extrait choisi par l'enseignant (le lecteur démarre au début de
 * l'extrait et s'arrête à sa fin ; « Écouter l'extrait » le rejoue).
 */
export default function MediaQuestion({ media, src, extrait = null, transcription = null }) {
  const { t } = useTranslation();
  const lecteur = useRef(null);
  const [agrandie, setAgrandie] = useState(false);
  const debut = extrait?.debut ?? 0;
  const fin = extrait?.fin ?? null;

  useEffect(() => {
    const el = lecteur.current;
    if (!el) return undefined;
    const placer = () => {
      if (debut && Math.abs(el.currentTime - debut) > 0.5 && el.currentTime < debut) el.currentTime = debut;
    };
    const borner = () => {
      if (fin !== null && el.currentTime >= fin) {
        el.pause();
        el.currentTime = fin;
      }
    };
    el.addEventListener('loadedmetadata', placer);
    el.addEventListener('timeupdate', borner);
    if (el.readyState >= 1) placer();
    return () => {
      el.removeEventListener('loadedmetadata', placer);
      el.removeEventListener('timeupdate', borner);
    };
  }, [debut, fin, src]);

  if (!media || !src) return null;

  const rejouer = () => {
    const el = lecteur.current;
    if (!el) return;
    el.currentTime = debut;
    el.play().catch(() => {});
  };

  if (media.type === 'image') {
    return (
      <>
        <ButtonBase
          onClick={() => setAgrandie(true)}
          aria-label={t('studio.media.agrandir')}
          sx={{ display: 'block', borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider', maxWidth: '100%', bgcolor: 'background.default' }}
        >
          <Box component="img" src={src} alt={media.description || ''} sx={{ display: 'block', maxWidth: '100%', maxHeight: { xs: 260, md: 380 }, objectFit: 'contain', mx: 'auto' }} />
        </ButtonBase>
        <Dialog open={agrandie} onClose={() => setAgrandie(false)} maxWidth="lg" fullWidth aria-label={media.description || t('studio.media.types.image')}>
          <Box sx={{ position: 'relative', bgcolor: 'background.default' }}>
            <IconButton onClick={() => setAgrandie(false)} aria-label={t('common.close', 'Fermer')} sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper' }}>
              <Close />
            </IconButton>
            <Box component="img" src={src} alt={media.description || ''} sx={{ display: 'block', width: '100%', maxHeight: '85vh', objectFit: 'contain' }} />
          </Box>
        </Dialog>
      </>
    );
  }

  const Lecteur = media.type === 'video' ? 'video' : 'audio';
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
      <Box
        component={Lecteur}
        ref={lecteur}
        src={src}
        controls
        preload="metadata"
        aria-label={media.description || t(`studio.media.types.${media.type}`)}
        sx={{ display: 'block', width: '100%', maxHeight: media.type === 'video' ? { xs: 240, md: 360 } : undefined, borderRadius: 1, bgcolor: media.type === 'video' ? 'common.black' : undefined }}
      />
      {(extrait?.debut || extrait?.fin) && (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
          <Button size="small" startIcon={<Replay />} onClick={rejouer}>
            {t('studio.media.rejouer')}
          </Button>
          <Typography variant="caption" color="text.secondary">
            {t('studio.media.extraitDe', { debut: minutage(debut), fin: fin === null ? minutage(media.duree) : minutage(fin) })}
          </Typography>
        </Stack>
      )}
      {transcription && (
        <Box component="details" sx={{ mt: 1 }}>
          <Typography component="summary" variant="body2" sx={{ cursor: 'pointer', fontWeight: 600 }}>
            {t('studio.joueur.transcription')}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
            {transcription}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
