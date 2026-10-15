import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, TextField, Typography } from '@mui/material';
import { Flag } from '@mui/icons-material';
import { studioAPI } from '../../../services/studioApi';
import { useToast } from '../../../contexts/ToastContext';
import ReponseQuestion from '../reponses/ReponseQuestion';
import MediaQuestion from '../MediaQuestion';
import { StatutCorrection } from '../joueur/ResultatCopie';
import { vueEtudiant } from '../../../../../shared/quiz/studio/vueEtudiant.js';
import { bonneReponse } from '../../../../../shared/quiz/studio/correction.js';

/**
 * Copie d'un étudiant, vue par l'enseignant : chaque question avec la réponse donnée, la bonne
 * réponse et les points. Une réponse rédigée (ou une réponse juste que la correction automatique
 * n'a pas reconnue) se note à la main, avec un commentaire.
 */

function NoteAMain({ idCopie, entree, onNotee }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [points, setPoints] = useState(entree.correction?.points ?? '');
  const [commentaire, setCommentaire] = useState(entree.correction?.commentaire ?? '');
  const noter = async () => {
    try {
      onNotee(await studioAPI.noter(idCopie, entree.question.id_question, { points: Number(points), commentaire }));
      toast.success(t('studio.resultats.notee'));
    } catch (e) {
      toast.error(e.message);
    }
  };
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} sx={{ mt: 1.5 }}>
      <TextField size="small" type="number" label={`${t('studio.resultats.noter')} / ${entree.question.points}`} value={points} onChange={(e) => setPoints(e.target.value)} inputProps={{ min: 0, max: entree.question.points, step: 0.25 }} sx={{ width: 140 }} />
      <TextField size="small" label={t('studio.resultats.commentaire')} value={commentaire} onChange={(e) => setCommentaire(e.target.value)} inputProps={{ maxLength: 1000 }} sx={{ flex: 1 }} />
      <Button variant="outlined" onClick={noter} disabled={points === ''}>
        {t('studio.resultats.enregistrerNote')}
      </Button>
    </Stack>
  );
}

export default function CopieDialog({ idCopie, onFermer, onNotee }) {
  const { t } = useTranslation();
  const [copie, setCopie] = useState(null);
  useEffect(() => {
    setCopie(null);
    if (idCopie) studioAPI.copie(idCopie).then(setCopie).catch(() => onFermer());
  }, [idCopie, onFermer]);
  const nom = copie?.etudiant ? `${copie.etudiant.prenom} ${copie.etudiant.nom}` : '';
  return (
    <Dialog open={Boolean(idCopie)} onClose={onFermer} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle>
        {t('studio.resultats.copieTitre', { nom })}
        {copie && (
          <Typography variant="body2" color="text.secondary">
            {copie.points ?? 0} / {copie.max ?? 0} · {copie.pourcentage ?? 0} %
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {!copie ? (
          <CircularProgress aria-label={t('common.loading')} />
        ) : (
          <Stack spacing={2.5} divider={<Divider flexItem />}>
            {copie.questions.map((entree, i) => {
              const q = entree.question;
              const correction = entree.correction ? { ...entree.correction, bonne_reponse: bonneReponse(q) } : null;
              return (
                <Box key={q.id_question}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="overline" color="text.secondary">
                      {i + 1}. {t(`studio.types.${q.type}.nom`)}
                    </Typography>
                    {entree.marquee && <Flag fontSize="small" sx={{ color: 'warning.main' }} aria-label={t('studio.joueur.legendeMarquee')} />}
                  </Stack>
                  <Typography sx={{ fontWeight: 600, mb: 1, whiteSpace: 'pre-line' }}>{q.enonce}</Typography>
                  {q.id_media && q.type !== 'zone_image' && copie.medias?.[q.id_media] && (
                    <Box sx={{ mb: 1.5 }}>
                      <MediaQuestion media={copie.medias[q.id_media]} src={studioAPI.urlMedia(q.id_media)} extrait={q.extrait} />
                    </Box>
                  )}
                  <ReponseQuestion question={vueEtudiant(q)} valeur={entree.reponse} correction={correction} desactive srcMedia={q.id_media ? studioAPI.urlMedia(q.id_media) : null} />
                  <Box sx={{ mt: 1 }}>
                    <StatutCorrection correction={entree.correction} />
                  </Box>
                  {copie.statut === 'rendue' && (
                    <NoteAMain
                      idCopie={copie.id_tentative}
                      entree={entree}
                      onNotee={(c) => {
                        setCopie(c);
                        onNotee();
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onFermer}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
