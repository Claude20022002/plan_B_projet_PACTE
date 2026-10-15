import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { AutoAwesome, Audiotrack, Description, Headphones, Lightbulb, Movie } from '@mui/icons-material';
import { TYPES_IA } from '../../../../../shared/quiz/studio/types.js';
import { studioAPI } from '../../../services/studioApi';
import { IconeType } from '../typesQuestion';
import ChoixMediaDialog from './ChoixMediaDialog';

/**
 * Générer des questions avec l'IA : dans un nouveau quiz, ou à la suite d'un quiz ouvert
 * (`idQuestionnaire`). Quatre sources : un sujet, un support de cours, un audio ou une vidéo
 * (transcrit, chaque question renvoie à son extrait), une écoute écrite puis lue par l'IA.
 */

const SOURCES = [
  { code: 'sujet', icone: <Lightbulb />, besoin: 'texte' },
  { code: 'fichier', icone: <Description />, besoin: 'texte' },
  { code: 'media', icone: <Movie />, besoin: 'transcription' },
  { code: 'ecoute', icone: <Headphones />, besoin: 'voix' },
];

export default function GenererIaDialog({ ouvert, onFermer, idQuestionnaire = null, etiquettes = [], onLancee }) {
  const { t } = useTranslation();
  const [dispo, setDispo] = useState(null);
  const [source, setSource] = useState('sujet');
  const [sujet, setSujet] = useState('');
  const [fichier, setFichier] = useState(null);
  const [plage, setPlage] = useState('');
  const [media, setMedia] = useState(null);
  const [choixMedia, setChoixMedia] = useState(false);
  const [nombre, setNombre] = useState(10);
  const [types, setTypes] = useState(['choix_unique', 'choix_multiple', 'vrai_faux']);
  const [difficulte, setDifficulte] = useState('application');
  const [langue, setLangue] = useState('fr');
  const [erreur, setErreur] = useState(null);
  const [envoi, setEnvoi] = useState(false);
  const champ = useRef(null);

  useEffect(() => {
    if (ouvert) {
      setErreur(null);
      studioAPI.disponibiliteIa().then(setDispo).catch((e) => setErreur(e.message));
    }
  }, [ouvert]);

  const disponible = (code) => Boolean(dispo?.[SOURCES.find((s) => s.code === code).besoin]) && Boolean(dispo?.texte);
  const pret = dispo?.texte && types.length && ((source === 'sujet' && sujet.trim()) || (source === 'fichier' && fichier) || (source === 'media' && media) || (source === 'ecoute' && sujet.trim()));

  const lancer = async () => {
    setEnvoi(true);
    setErreur(null);
    try {
      const r = await studioAPI.generer({
        id_questionnaire: idQuestionnaire ?? undefined,
        etiquettes: idQuestionnaire ? undefined : etiquettes,
        sujet: ['sujet', 'ecoute'].includes(source) || (source === 'fichier' && sujet.trim()) ? sujet.trim() || undefined : undefined,
        fichier: source === 'fichier' ? fichier : undefined,
        plage: source === 'fichier' ? plage || undefined : undefined,
        id_media: source === 'media' ? media.id_media : undefined,
        ecoute: source === 'ecoute' ? '1' : undefined,
        nombre,
        types,
        difficulte,
        langue,
      });
      onLancee(r.id_questionnaire);
    } catch (e) {
      setErreur(e.message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <Dialog open={ouvert} onClose={onFermer} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutoAwesome color="primary" /> {t('studio.ia.titre')}
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2.5, pt: '8px !important' }}>
        {dispo && !dispo.texte && <Alert severity="warning">{t('studio.nouveau.iaIndisponible')}</Alert>}
        {erreur && <Alert severity="error">{erreur}</Alert>}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            {t('studio.ia.source')}
          </Typography>
          <ToggleButtonGroup exclusive value={source} onChange={(_, v) => v && setSource(v)} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' } }}>
            {SOURCES.map((s) => (
              <ToggleButton key={s.code} value={s.code} disabled={!disponible(s.code)} sx={{ flexDirection: 'column', gap: 0.5, py: 1.25, textTransform: 'none' }} title={!disponible(s.code) ? t('studio.ia.indisponible') : undefined}>
                {s.icone}
                <Typography variant="caption" sx={{ lineHeight: 1.2 }}>
                  {t(`studio.ia.${s.code}`)}
                </Typography>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {(source === 'sujet' || source === 'ecoute' || source === 'fichier') && (
          <TextField
            label={t('studio.ia.sujetLabel')}
            value={sujet}
            onChange={(e) => setSujet(e.target.value)}
            inputProps={{ maxLength: 200 }}
            required={source !== 'fichier'}
            helperText={source === 'ecoute' ? t('studio.ia.ecouteAide') : t('studio.ia.sujetAide')}
          />
        )}
        {source === 'fichier' && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Button variant="outlined" onClick={() => champ.current?.click()} startIcon={<Description />}>
              {fichier ? fichier.name : t('studio.ia.fichierChoisir')}
            </Button>
            <input ref={champ} type="file" hidden accept=".pdf,.docx,.pptx,application/pdf" onChange={(e) => setFichier(e.target.files?.[0] ?? null)} />
            <TextField size="small" label={t('studio.ia.plage')} value={plage} onChange={(e) => setPlage(e.target.value)} helperText={t('studio.ia.plageAide')} sx={{ maxWidth: 220 }} />
          </Stack>
        )}
        {source === 'media' && (
          <Box>
            <Button variant="outlined" onClick={() => setChoixMedia(true)} startIcon={media?.type === 'video' ? <Movie /> : <Audiotrack />}>
              {media ? media.nom : t('studio.ia.mediaChoisir')}
            </Button>
            <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 0.5 }}>
              {t('studio.ia.mediaAide')}
            </Typography>
          </Box>
        )}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField type="number" label={t('studio.ia.nombre')} value={nombre} onChange={(e) => setNombre(Math.max(1, Math.min(dispo?.nombre_max ?? 30, Number(e.target.value) || 1)))} inputProps={{ min: 1, max: dispo?.nombre_max ?? 30 }} sx={{ minWidth: 140 }} />
          <TextField select label={t('studio.ia.difficulte')} value={difficulte} onChange={(e) => setDifficulte(e.target.value)} fullWidth>
            {['decouverte', 'application', 'approfondissement'].map((d) => (
              <MenuItem key={d} value={d}>
                {t(`studio.ia.difficultes.${d}`)}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label={t('studio.ia.langue')} value={langue} onChange={(e) => setLangue(e.target.value)} sx={{ minWidth: 140 }}>
            {['fr', 'en', 'es', 'de'].map((l) => (
              <MenuItem key={l} value={l}>
                {t(`studio.ia.langues.${l}`)}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        <Box component="fieldset" sx={{ border: 0, p: 0, m: 0 }}>
          <Typography component="legend" variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            {t('studio.ia.types')}
          </Typography>
          <FormGroup sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
            {TYPES_IA.map((type) => (
              <FormControlLabel
                key={type}
                control={<Checkbox checked={types.includes(type)} onChange={(e) => setTypes(e.target.checked ? [...types, type] : types.filter((x) => x !== type))} />}
                label={
                  <Stack direction="row" spacing={1} alignItems="center">
                    <IconeType type={type} fontSize="small" color="action" />
                    <span>{t(`studio.types.${type}.nom`)}</span>
                  </Stack>
                }
              />
            ))}
          </FormGroup>
        </Box>
        <Alert severity="info" icon={false}>
          {t('studio.ia.relecture')}
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, justifyContent: 'space-between' }}>
        {dispo ? <Chip size="small" variant="outlined" label={t('studio.ia.restantes', { count: dispo.restantes.quiz })} /> : <span />}
        <Stack direction="row" spacing={1}>
          <Button onClick={onFermer}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={lancer} disabled={!pret || envoi} startIcon={<AutoAwesome />}>
            {t('studio.ia.lancer')}
          </Button>
        </Stack>
      </DialogActions>
      <ChoixMediaDialog
        ouvert={choixMedia}
        onFermer={() => setChoixMedia(false)}
        types={['audio', 'video']}
        onChoisir={(m) => {
          setMedia(m);
          setChoixMedia(false);
        }}
      />
    </Dialog>
  );
}
