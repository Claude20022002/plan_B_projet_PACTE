import { useTranslation } from 'react-i18next';
import { Box, Stack, Typography } from '@mui/material';
import MediaQuestion from '../MediaQuestion';
import ReponseQuestion from '../reponses/ReponseQuestion';
import Chrono from './Chrono';

/**
 * Une question du quiz en direct : numéro, chrono, énoncé, média et réponses. Même composant sur
 * l'écran projeté (`grand`, réponses en lecture seule) et sur le téléphone (réponses à choisir).
 * En correction, `correction` colore la bonne réponse, comme dans le Studio.
 */
export default function QuestionDirect({ vue, restant = null, srcMedia = null, valeur = null, onChange, desactive = true, correction = null, grand = false }) {
  const { t } = useTranslation();
  const question = vue.question;
  return (
    <Stack spacing={grand ? 3 : 2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Typography variant="overline" component="p" color="text.secondary" sx={{ fontSize: grand ? 16 : 13 }}>
          {t('direct.ecran.question', { n: vue.index + 1, total: vue.total })}
        </Typography>
        <Chrono restant={restant} duree={vue.duree_s} taille={grand ? 120 : 64} />
      </Stack>
      <Typography component="h2" sx={{ fontWeight: 700, fontSize: grand ? { xs: 26, md: 40 } : 20, lineHeight: 1.25, whiteSpace: 'pre-line' }}>
        {question.enonce}
      </Typography>
      {vue.media && srcMedia && (
        <Box sx={{ maxWidth: grand ? 720 : '100%' }}>
          <MediaQuestion media={vue.media} src={srcMedia} extrait={question.extrait} />
        </Box>
      )}
      <Box sx={grand ? { '& .MuiTypography-root': { fontSize: 22 }, '& .MuiButtonBase-root': { minHeight: 72 } } : undefined}>
        <ReponseQuestion question={question} valeur={valeur} onChange={onChange} desactive={desactive} correction={correction} />
      </Box>
    </Stack>
  );
}
