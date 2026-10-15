import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, FormControlLabel, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import { MOTIF_TROU } from '../../../../../shared/quiz/studio/types.js';

/** Champs de l'éditeur pour les réponses saisies : courte, nombre, texte à trous, rédigée. */

/** Liste éditée une valeur par ligne (réponses acceptées, options d'une liste déroulante). */
export function ChampLignes({ label, valeur, onChange, aide, lignes = 3 }) {
  return <TextField label={label} multiline minRows={lignes} value={(valeur ?? []).join('\n')} onChange={(e) => onChange(e.target.value.split('\n'))} helperText={aide} fullWidth />;
}

function Interrupteurs({ d, maj, champs }) {
  const { t } = useTranslation();
  return (
    <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 0, md: 2 }} flexWrap="wrap">
      {champs.map((c) => (
        <FormControlLabel key={c} control={<Switch checked={d[c] === true} onChange={(e) => maj({ ...d, [c]: e.target.checked })} />} label={t(`studio.question.${c}`)} />
      ))}
    </Stack>
  );
}

export function ChampsCourte({ question, maj }) {
  const { t } = useTranslation();
  const d = question.donnees;
  return (
    <Stack spacing={1.5}>
      <ChampLignes label={t('studio.question.acceptees')} valeur={d.acceptees} onChange={(acceptees) => maj({ ...d, acceptees })} aide={t('studio.question.accepteesAide')} />
      <Interrupteurs d={d} maj={maj} champs={['casse', 'accents', 'fautes']} />
    </Stack>
  );
}

export function ChampsNumerique({ question, maj }) {
  const { t } = useTranslation();
  const d = question.donnees;
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <TextField label={t('studio.question.valeur')} value={d.valeur ?? ''} onChange={(e) => maj({ ...d, valeur: e.target.value })} inputProps={{ inputMode: 'decimal' }} required />
      <TextField label={t('studio.question.tolerance')} value={d.tolerance ?? 0} onChange={(e) => maj({ ...d, tolerance: e.target.value })} inputProps={{ inputMode: 'decimal' }} />
      <TextField label={t('studio.question.unite')} value={d.unite ?? ''} onChange={(e) => maj({ ...d, unite: e.target.value })} inputProps={{ maxLength: 20 }} />
    </Stack>
  );
}

/** Repères {{n}} présents dans le texte, dans l'ordre et sans doublon. */
const reperesDe = (texte) => [...new Set([...String(texte ?? '').matchAll(MOTIF_TROU)].map((m) => m[1]))];

export function ChampsTrous({ question, maj }) {
  const { t } = useTranslation();
  const d = question.donnees;
  const champ = useRef(null);
  const reperes = reperesDe(d.texte);
  // Les trous suivent le texte : un repère ajouté crée son trou, un repère effacé le retire
  const synchroniser = (texte) => {
    const ids = reperesDe(texte);
    maj({ ...d, texte, trous: ids.map((id) => d.trous.find((x) => x.id === id) ?? { id, acceptees: [''] }) });
  };
  const inserer = () => {
    const n = Math.max(0, ...reperes.map(Number)) + 1;
    const el = champ.current;
    const debut = el?.selectionStart ?? d.texte.length;
    const fin = el?.selectionEnd ?? d.texte.length;
    // Le texte sélectionné devient la réponse du trou
    const selection = d.texte.slice(debut, fin).trim();
    const texte = `${d.texte.slice(0, debut)}{{${n}}}${d.texte.slice(fin)}`;
    const ids = reperesDe(texte);
    maj({ ...d, texte, trous: ids.map((id) => d.trous.find((x) => x.id === id) ?? { id, acceptees: [id === String(n) && selection ? selection : ''] }) });
    requestAnimationFrame(() => el?.focus());
  };
  const majTrou = (id, champs) => maj({ ...d, trous: d.trous.map((x) => (x.id === id ? { ...x, ...champs } : x)) });
  return (
    <Stack spacing={1.5}>
      <TextField
        inputRef={champ}
        label={t('studio.question.texteTrous')}
        multiline
        minRows={3}
        value={d.texte}
        onChange={(e) => synchroniser(e.target.value)}
        helperText={t('studio.question.texteTrousAide', { exemple: '{{1}}, {{2}}' })}
        fullWidth
      />
      <Box>
        <Button startIcon={<Add />} onClick={inserer} disabled={reperes.length >= 10}>
          {t('studio.question.insererTrou')}
        </Button>
      </Box>
      {d.trous.map((trou) => (
        <Paper key={trou.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
            {t('studio.question.trou', { n: trou.id })}
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <ChampLignes label={t('studio.question.acceptees')} valeur={trou.acceptees} onChange={(acceptees) => majTrou(trou.id, { acceptees })} lignes={2} />
            <ChampLignes label={t('studio.question.trouListe')} valeur={trou.options ?? []} onChange={(options) => majTrou(trou.id, { options })} lignes={2} />
          </Stack>
        </Paper>
      ))}
      <Interrupteurs d={d} maj={maj} champs={['casse', 'accents']} />
    </Stack>
  );
}

export function ChampsLibre({ question, maj }) {
  const { t } = useTranslation();
  const d = question.donnees;
  return (
    <Stack spacing={1.5}>
      <TextField label={t('studio.question.corrige')} multiline minRows={3} value={d.corrige ?? ''} onChange={(e) => maj({ ...d, corrige: e.target.value })} fullWidth />
      <TextField type="number" label={t('studio.question.longueurMax')} value={d.longueur_max ?? 1500} onChange={(e) => maj({ ...d, longueur_max: Number(e.target.value) })} inputProps={{ min: 50, max: 5000, step: 50 }} sx={{ maxWidth: 240 }} />
    </Stack>
  );
}
