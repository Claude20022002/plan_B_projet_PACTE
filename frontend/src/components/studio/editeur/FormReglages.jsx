import { useTranslation } from 'react-i18next';
import { FormControlLabel, MenuItem, Stack, Switch, TextField } from '@mui/material';

/** Réglages d'un quiz ou d'une passation (services/studio/reglages.js côté serveur). `compact` : seulement l'essentiel. */
export default function FormReglages({ reglages, onChange, compact = false }) {
  const { t } = useTranslation();
  const maj = (champ, valeur) => onChange({ ...reglages, [champ]: valeur });
  const nombre = (champ, min, max) => (e) => maj(champ, Math.max(min, Math.min(max, Math.round(Number(e.target.value) || 0))));
  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField type="number" label={t('studio.reglages.duree')} helperText={t('studio.reglages.dureeAide')} value={reglages.duree_min} onChange={nombre('duree_min', 0, 600)} inputProps={{ min: 0, max: 600 }} fullWidth />
        <TextField type="number" label={t('studio.reglages.tentatives')} helperText={t('studio.reglages.tentativesAide')} value={reglages.tentatives_max} onChange={nombre('tentatives_max', 0, 20)} inputProps={{ min: 0, max: 20 }} fullWidth />
        <TextField type="number" label={t('studio.reglages.seuil')} value={reglages.seuil_reussite} onChange={nombre('seuil_reussite', 0, 100)} inputProps={{ min: 0, max: 100 }} fullWidth />
      </Stack>
      <TextField select label={t('studio.reglages.correction')} value={reglages.correction} onChange={(e) => maj('correction', e.target.value)} fullWidth>
        {['immediate', 'fin', 'score', 'jamais'].map((c) => (
          <MenuItem key={c} value={c}>
            {t(`studio.reglages.corrections.${c}`)}
          </MenuItem>
        ))}
      </TextField>
      <TextField select label={t('studio.reglages.navigation')} value={reglages.navigation} onChange={(e) => maj('navigation', e.target.value)} fullWidth>
        {['libre', 'lineaire'].map((n) => (
          <MenuItem key={n} value={n}>
            {t(`studio.reglages.navigations.${n}`)}
          </MenuItem>
        ))}
      </TextField>
      {!compact && (
        <Stack>
          <FormControlLabel control={<Switch checked={reglages.melanger_questions} onChange={(e) => maj('melanger_questions', e.target.checked)} />} label={t('studio.reglages.melangerQuestions')} />
          <FormControlLabel control={<Switch checked={reglages.melanger_options} onChange={(e) => maj('melanger_options', e.target.checked)} />} label={t('studio.reglages.melangerOptions')} />
          <FormControlLabel control={<Switch checked={reglages.notation_partielle} onChange={(e) => maj('notation_partielle', e.target.checked)} />} label={t('studio.reglages.partielle')} />
        </Stack>
      )}
    </Stack>
  );
}
