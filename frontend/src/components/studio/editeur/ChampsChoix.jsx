import { useTranslation } from 'react-i18next';
import { Box, Button, Checkbox, FormControlLabel, IconButton, Radio, Stack, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Add, Close } from '@mui/icons-material';
import { idLibre } from '../outils';

/** Champs de l'éditeur pour les questions à choix (unique, multiple) et vrai ou faux. */

const LETTRES = 'ABCDEFGH';

export function ChampsChoix({ question, maj }) {
  const { t } = useTranslation();
  const d = question.donnees;
  const multiple = question.type === 'choix_multiple';
  const bonnes = multiple ? d.bonnes ?? [] : d.bonne ? [d.bonne] : [];
  const changerTexte = (id, texte) => maj({ ...d, options: d.options.map((o) => (o.id === id ? { ...o, texte } : o)) });
  const basculerBonne = (id) => {
    if (!multiple) return maj({ ...d, bonne: id });
    return maj({ ...d, bonnes: bonnes.includes(id) ? bonnes.filter((x) => x !== id) : [...bonnes, id] });
  };
  const retirer = (id) =>
    maj({ ...d, options: d.options.filter((o) => o.id !== id), ...(multiple ? { bonnes: bonnes.filter((x) => x !== id) } : { bonne: d.bonne === id ? null : d.bonne }) });
  const ajouter = () => maj({ ...d, options: [...d.options, { id: idLibre(d.options, 'o'), texte: '' }] });
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
        {t('studio.question.options')}
      </Typography>
      <Stack spacing={1} role={multiple ? 'group' : 'radiogroup'} aria-label={t('studio.question.bonne')}>
        {d.options.map((o, i) => {
          const juste = bonnes.includes(o.id);
          const Marque = multiple ? Checkbox : Radio;
          return (
            <Stack key={o.id} direction="row" spacing={1} alignItems="center">
              <Marque checked={juste} onChange={() => basculerBonne(o.id)} color="success" inputProps={{ 'aria-label': `${t('studio.question.bonne')} : ${LETTRES[i]}` }} />
              <TextField
                fullWidth
                size="small"
                value={o.texte}
                onChange={(e) => changerTexte(o.id, e.target.value)}
                label={t('studio.question.option', { n: LETTRES[i] })}
                inputProps={{ maxLength: 300 }}
                color={juste ? 'success' : undefined}
                focused={juste || undefined}
              />
              <IconButton onClick={() => retirer(o.id)} disabled={d.options.length <= 2} aria-label={`${t('studio.question.retirer')} ${LETTRES[i]}`}>
                <Close />
              </IconButton>
            </Stack>
          );
        })}
      </Stack>
      <Button startIcon={<Add />} onClick={ajouter} disabled={d.options.length >= 8} sx={{ mt: 1 }}>
        {t('studio.question.ajouterOption')}
      </Button>
      {multiple && (
        <FormControlLabel sx={{ display: 'flex', mt: 1 }} control={<Switch checked={d.annoncer_nombre !== false} onChange={(e) => maj({ ...d, annoncer_nombre: e.target.checked })} />} label={t('studio.question.annoncerNombre')} />
      )}
    </Box>
  );
}

export function ChampsVraiFaux({ question, maj }) {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }} id="vf-juste">
        {t('studio.question.reponseJuste')}
      </Typography>
      <ToggleButtonGroup exclusive value={question.donnees.reponse} onChange={(_, v) => v !== null && maj({ reponse: v })} aria-labelledby="vf-juste" color="success">
        <ToggleButton value={true} sx={{ px: 4 }}>
          {t('studio.question.vrai')}
        </ToggleButton>
        <ToggleButton value={false} sx={{ px: 4 }}>
          {t('studio.question.faux')}
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
}
