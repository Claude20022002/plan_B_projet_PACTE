import { useTranslation } from 'react-i18next';
import { Box, ButtonBase, Chip, Paper, Stack, Typography } from '@mui/material';
import { CheckBoxOutlineBlank, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { IconeType } from '../typesQuestion';

/**
 * Une question qui n'est pas en cours d'édition, comme dans Google Forms : son énoncé et, pour les
 * questions à choix, ses options (la bonne réponse en vert). Un clic l'ouvre.
 */
export default function ApercuQuestion({ element, numero, onOuvrir }) {
  const { t } = useTranslation();
  const { brouillon: q, enregistree } = element;
  const choix = q.type === 'choix_unique' || q.type === 'choix_multiple';
  const bonnes = q.type === 'choix_multiple' ? q.donnees.bonnes ?? [] : [q.donnees.bonne];
  const Case = q.type === 'choix_multiple' ? CheckBoxOutlineBlank : RadioButtonUnchecked;

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: enregistree?.a_relire ? 'warning.main' : 'divider', overflow: 'hidden' }}>
      <ButtonBase onClick={onOuvrir} sx={{ display: 'block', width: '100%', textAlign: 'left', p: { xs: 2, sm: 3 }, '&:hover': { bgcolor: 'action.hover' } }}>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Typography sx={{ flex: 1, fontWeight: 500, overflowWrap: 'anywhere', fontStyle: q.enonce ? 'normal' : 'italic', color: q.enonce ? 'text.primary' : 'text.secondary' }}>
            {numero}. {q.enonce || t('studio.formulaire.sansEnonce')}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
            {t('studio.banque.points', { count: Number(q.points) || 0 })}
          </Typography>
        </Stack>
        {choix ? (
          <Stack spacing={0.5} sx={{ mt: 1.5 }}>
            {q.donnees.options.map((o) => (
              <Stack key={o.id} direction="row" spacing={1} alignItems="center">
                {bonnes.includes(o.id) ? <CheckCircle fontSize="small" color="success" /> : <Case fontSize="small" color="disabled" />}
                <Typography variant="body2" color={o.texte ? 'text.primary' : 'text.disabled'}>
                  {o.texte || '…'}
                </Typography>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            <IconeType type={q.type} fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {t(`studio.types.${q.type}.nom`)}
            </Typography>
          </Stack>
        )}
        <Box sx={{ mt: enregistree?.a_relire || !enregistree ? 1 : 0, display: 'flex', gap: 1 }}>
          {enregistree?.a_relire && <Chip size="small" color="warning" label={t('studio.editeur.aRelire')} />}
          {!enregistree && <Chip size="small" variant="outlined" label={t('studio.formulaire.nonEnregistree')} />}
        </Box>
      </ButtonBase>
    </Paper>
  );
}
