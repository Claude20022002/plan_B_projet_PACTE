import { useTranslation } from 'react-i18next';
import { Box, Button, ButtonBase, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, IconButton, Stack, Typography, useMediaQuery } from '@mui/material';
import { Close, Flag } from '@mui/icons-material';
import { aUneReponse } from '../outils';

/**
 * Vue d'ensemble de l'épreuve (comme le « Review » de l'examen Cisco) : une case par question,
 * pleine si elle a une réponse, drapeau si elle est marquée à revoir ; on y va d'un clic.
 * La confirmation du rendu dit combien de questions restent sans réponse ou à revoir.
 */

function Case({ numero, repondue, marquee, courante, bloquee, onClick, libelle }) {
  return (
    <ButtonBase
      onClick={onClick}
      disabled={bloquee}
      aria-label={libelle}
      aria-current={courante ? 'step' : undefined}
      sx={{
        position: 'relative',
        height: 48,
        borderRadius: 1.5,
        border: 2,
        borderColor: courante ? 'primary.main' : repondue ? 'primary.main' : 'divider',
        bgcolor: repondue ? 'primary.main' : 'background.paper',
        color: repondue ? 'primary.contrastText' : 'text.primary',
        fontWeight: 700,
        outline: courante ? '3px solid' : 'none',
        outlineColor: 'primary.light',
        outlineOffset: 2,
        opacity: bloquee ? 0.45 : 1,
        '&.Mui-focusVisible': { outline: '3px solid', outlineColor: 'primary.main' },
      }}
    >
      {numero}
      {marquee && <Flag aria-hidden sx={{ position: 'absolute', top: -8, right: -8, fontSize: 20, color: 'warning.main', bgcolor: 'background.paper', borderRadius: '50%' }} />}
    </ButtonBase>
  );
}

export default function VueEnsemble({ ouvert, onFermer, questions, reponses, marquees, index, lineaire, onAller, onRendre }) {
  const { t } = useTranslation();
  const large = useMediaQuery((theme) => theme.breakpoints.up('sm'));
  return (
    <Drawer anchor={large ? 'right' : 'bottom'} open={ouvert} onClose={onFermer} PaperProps={{ sx: { width: { sm: 380 }, maxHeight: { xs: '85vh', sm: '100%' }, p: 2.5, borderTopLeftRadius: { xs: 16, sm: 0 }, borderTopRightRadius: { xs: 16, sm: 0 } } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h6" component="h2">
          {t('studio.joueur.vueEnsemble')}
        </Typography>
        <IconButton onClick={onFermer} aria-label={t('common.close')}>
          <Close />
        </IconButton>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('studio.joueur.vueAide')}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(48px, 1fr))', gap: 1.25, mb: 2 }}>
        {questions.map((q, i) => {
          const repondue = aUneReponse(reponses[q.id_question]);
          const marquee = marquees.includes(q.id_question);
          const etat = [repondue ? t('studio.joueur.repondue') : t('studio.joueur.nonRepondue'), marquee ? t('studio.joueur.legendeMarquee') : null].filter(Boolean).join(', ');
          return (
            <Case
              key={q.id_question}
              numero={i + 1}
              repondue={repondue}
              marquee={marquee}
              courante={i === index}
              bloquee={lineaire && i < index}
              libelle={`${t('studio.joueur.question', { n: i + 1, total: questions.length })} : ${etat}`}
              onClick={() => {
                onAller(i);
                onFermer();
              }}
            />
          );
        })}
      </Box>
      <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap', rowGap: 1 }} aria-hidden>
        <Legende pleine texte={t('studio.joueur.repondue')} />
        <Legende texte={t('studio.joueur.nonRepondue')} />
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Flag fontSize="small" sx={{ color: 'warning.main' }} />
          <Typography variant="caption">{t('studio.joueur.legendeMarquee')}</Typography>
        </Stack>
      </Stack>
      <Box sx={{ mt: 'auto' }}>
        <Button fullWidth variant="contained" size="large" onClick={onRendre}>
          {t('studio.joueur.rendre')}
        </Button>
      </Box>
    </Drawer>
  );
}

function Legende({ pleine = false, texte }) {
  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      <Box sx={{ width: 14, height: 14, borderRadius: 0.5, border: 2, borderColor: pleine ? 'primary.main' : 'divider', bgcolor: pleine ? 'primary.main' : 'transparent' }} />
      <Typography variant="caption">{texte}</Typography>
    </Stack>
  );
}

export function RendreDialog({ ouvert, onFermer, onConfirmer, sansReponse, marquees, envoi }) {
  const { t } = useTranslation();
  return (
    <Dialog open={ouvert} onClose={onFermer} maxWidth="xs" fullWidth>
      <DialogTitle>{t('studio.joueur.rendreTitre')}</DialogTitle>
      <DialogContent>
        <Stack spacing={1}>
          {sansReponse > 0 && <Typography sx={{ color: 'warning.main', fontWeight: 600 }}>{t('studio.joueur.rendreSansReponse', { count: sansReponse })}</Typography>}
          {marquees > 0 && <Typography sx={{ color: 'warning.main', fontWeight: 600 }}>{t('studio.joueur.rendreMarquees', { count: marquees })}</Typography>}
          {!sansReponse && !marquees && <Typography>{t('studio.joueur.rendreToutRepondu')}</Typography>}
          <Typography variant="body2" color="text.secondary">
            {t('studio.joueur.rendreDefinitif')}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onFermer}>{t('studio.joueur.continuer')}</Button>
        <Button variant="contained" onClick={onConfirmer} disabled={envoi}>
          {t('studio.joueur.rendre')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
