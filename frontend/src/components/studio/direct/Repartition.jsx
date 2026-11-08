import { useTranslation } from 'react-i18next';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { CheckCircleOutline } from '@mui/icons-material';

/**
 * Ce que la classe a répondu, projeté à la correction : une barre par option (la bonne marquée
 * d'une icône, jamais de la couleur seule), ou le nuage des réponses courtes.
 */
export default function Repartition({ question, correction }) {
  const { t } = useTranslation();
  const { repartition, nuage, bonne_reponse: bonne } = correction;
  if (repartition) {
    const libelles = question.type === 'vrai_faux' ? { true: t('studio.question.vrai'), false: t('studio.question.faux') } : Object.fromEntries((question.options ?? []).map((o) => [o.id, o.texte]));
    const bonnes = [].concat(bonne ?? []).map(String);
    const max = Math.max(1, ...repartition.map((r) => r.nombre));
    return (
      <Stack spacing={1} component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
        {repartition.map((r) => {
          const juste = bonnes.includes(r.id);
          return (
            <Box component="li" key={r.id} sx={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 2fr) 3fr auto', gap: 1.5, alignItems: 'center' }}>
              <Typography sx={{ fontWeight: juste ? 700 : 400, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {juste && <CheckCircleOutline color="success" fontSize="small" />}
                {libelles[r.id] ?? r.id}
              </Typography>
              <Box sx={{ height: 20, borderRadius: 1, bgcolor: 'action.hover', overflow: 'hidden' }}>
                <Box sx={{ height: '100%', width: `${(r.nombre / max) * 100}%`, bgcolor: juste ? 'success.main' : 'text.disabled', transition: 'width 400ms' }} />
              </Box>
              <Typography sx={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, minWidth: 24, textAlign: 'right' }}>{r.nombre}</Typography>
            </Box>
          );
        })}
      </Stack>
    );
  }
  if (nuage?.length) {
    const max = Math.max(...nuage.map((m) => m.nombre));
    return (
      <Box>
        <Typography variant="overline" component="p" color="text.secondary">
          {t('direct.ecran.nuage')}
        </Typography>
        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1}>
          {nuage.map((m) => (
            <Chip key={m.texte} label={`${m.texte} · ${m.nombre}`} variant={m.nombre === max ? 'filled' : 'outlined'} sx={{ fontSize: 14 + Math.round((m.nombre / max) * 10), height: 'auto', py: 0.5 }} />
          ))}
        </Stack>
      </Box>
    );
  }
  return null;
}
