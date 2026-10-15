import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { AddPhotoAlternate, Close, PlayArrow, Subtitles } from '@mui/icons-material';
import { studioAPI } from '../../../services/studioApi';
import { useToast } from '../../../contexts/ToastContext';
import ChoixMediaDialog from './ChoixMediaDialog';
import { minutage } from '../outils';

/**
 * Média d'une question dans l'éditeur : ajout (bibliothèque, dépôt, voix de synthèse), texte de
 * remplacement (accessibilité), extrait d'un audio ou d'une vidéo réglé sur la position du
 * lecteur, transcription par l'IA.
 */
export default function MediaEditeur({ question, media, onChanger, onMediaMaj, dispo }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [choix, setChoix] = useState(false);
  const [description, setDescription] = useState(media?.description ?? '');
  const [transcription, setTranscription] = useState(false);
  const lecteur = useRef(null);
  const extrait = question.extrait ?? null;

  useEffect(() => setDescription(media?.description ?? ''), [media?.id_media, media?.description]);

  const majExtrait = (champ, valeur) => {
    const suivant = { debut: extrait?.debut ?? 0, fin: extrait?.fin ?? null, [champ]: valeur === '' || valeur === null ? (champ === 'debut' ? 0 : null) : Number(valeur) };
    onChanger({ extrait: !suivant.debut && suivant.fin === null ? null : suivant });
  };
  const position = () => Math.round((lecteur.current?.currentTime ?? 0) * 10) / 10;
  const ecouter = () => {
    const el = lecteur.current;
    if (!el) return;
    el.currentTime = extrait?.debut ?? 0;
    el.play().catch(() => {});
    if (extrait?.fin) {
      const arret = () => {
        if (el.currentTime >= extrait.fin) {
          el.pause();
          el.removeEventListener('timeupdate', arret);
        }
      };
      el.addEventListener('timeupdate', arret);
    }
  };
  const enregistrerDescription = async () => {
    if (!media || description === (media.description ?? '')) return;
    try {
      onMediaMaj(await studioAPI.modifierMedia(media.id_media, { description }));
    } catch (e) {
      toast.error(e.message);
    }
  };
  const transcrire = async () => {
    setTranscription(true);
    try {
      onMediaMaj(await studioAPI.transcrire(media.id_media));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setTranscription(false);
    }
  };

  const types = question.type === 'zone_image' ? ['image'] : ['image', 'audio', 'video'];
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        {t('studio.media.titre')}
      </Typography>
      {!media ? (
        <Button variant="outlined" startIcon={<AddPhotoAlternate />} onClick={() => setChoix(true)}>
          {t('studio.media.ajouter')}
        </Button>
      ) : (
        <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" noWrap title={media.nom} sx={{ fontWeight: 600 }}>
              {t(`studio.media.types.${media.type}`)} · {media.nom}
            </Typography>
            <Button size="small" color="error" startIcon={<Close />} onClick={() => onChanger({ id_media: null, extrait: null })}>
              {t('studio.media.retirer')}
            </Button>
          </Stack>
          {media.type === 'image' && question.type !== 'zone_image' && <Box component="img" src={studioAPI.urlMedia(media.id_media)} alt={media.description || ''} sx={{ display: 'block', maxWidth: '100%', maxHeight: 240, borderRadius: 1, mb: 1 }} />}
          {media.type !== 'image' && <Box component={media.type === 'video' ? 'video' : 'audio'} ref={lecteur} src={studioAPI.urlMedia(media.id_media)} controls preload="metadata" sx={{ display: 'block', width: '100%', maxHeight: 260, mb: 1 }} />}
          <TextField size="small" fullWidth label={t('studio.media.description')} value={description} onChange={(e) => setDescription(e.target.value)} onBlur={enregistrerDescription} inputProps={{ maxLength: 500 }} />
          {media.type !== 'image' && (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
              <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 60 }}>
                {t('studio.media.extrait')}
              </Typography>
              {['debut', 'fin'].map((champ) => (
                <Stack key={champ} direction="row" spacing={0.5} alignItems="center">
                  <TextField size="small" type="number" label={t(`studio.media.${champ}`)} value={extrait?.[champ] ?? ''} onChange={(e) => majExtrait(champ, e.target.value)} inputProps={{ min: 0, step: 0.5 }} sx={{ width: 110 }} />
                  <Button size="small" onClick={() => majExtrait(champ, position())}>
                    {t('studio.media.utiliserPosition')}
                  </Button>
                </Stack>
              ))}
              <Button size="small" startIcon={<PlayArrow />} onClick={ecouter}>
                {t('studio.media.rejouer')}
              </Button>
              {extrait && (
                <Typography variant="caption" color="text.secondary">
                  {t('studio.media.extraitDe', { debut: minutage(extrait.debut), fin: extrait.fin === null ? minutage(media.duree) : minutage(extrait.fin) })}
                </Typography>
              )}
            </Stack>
          )}
          {media.type !== 'image' && (
            <Box sx={{ mt: 1.5 }}>
              {media.transcription?.texte ? (
                <Box component="details">
                  <Typography component="summary" variant="body2" sx={{ cursor: 'pointer', fontWeight: 600 }}>
                    {t('studio.media.transcription')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-line', maxHeight: 200, overflow: 'auto' }}>
                    {media.transcription.segments?.length ? media.transcription.segments.map((s) => `[${minutage(s.debut)}] ${s.texte}`).join('\n') : media.transcription.texte}
                  </Typography>
                </Box>
              ) : (
                dispo?.transcription && (
                  <Button size="small" startIcon={<Subtitles />} onClick={transcrire} disabled={transcription}>
                    {t('studio.media.transcrire')}
                  </Button>
                )
              )}
            </Box>
          )}
        </Paper>
      )}
      <ChoixMediaDialog
        ouvert={choix}
        onFermer={() => setChoix(false)}
        types={types}
        voixDisponible={Boolean(dispo?.voix)}
        onChoisir={(m) => {
          setChoix(false);
          onMediaMaj(m);
          onChanger({ id_media: m.id_media, extrait: null });
        }}
      />
    </Box>
  );
}
