import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Skeleton, Stack, TextField } from '@mui/material';
import { Add } from '@mui/icons-material';
import { quizAPI } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import QuestionBrouillon from '../creation/QuestionBrouillon';
import { erreurDuBrouillon } from '../../../utils/brouillonQuiz';
import { questionVide, versBrouillon, versServiceQuiz } from '../../../utils/mesQuiz';

const QUESTIONS_MAX = 50;

/**
 * Modifier un quiz du service de quiz depuis Planner (IA-5) : titre, questions et réponses, avec
 * l'éditeur de questions des quiz générés. Seuls les choix unique et multiple s'écrivent depuis
 * Planner ; un quiz qui a d'autres types de questions se modifie dans le service de quiz. Les parties
 * déjà jouées et les devoirs déjà donnés gardent leur copie.
 */
export default function EditerQuizDialog({ id, fermer, enregistre }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [quiz, setQuiz] = useState(null);
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    if (!id) return undefined;
    let actif = true;
    setQuiz(null);
    setErreur('');
    quizAPI
      .quizAModifier(id)
      .then((q) => actif && setQuiz({ ...q, questions: q.modifiable ? q.questions.map(versBrouillon) : [] }))
      .catch((e) => actif && setErreur(e?.message || t('mesQuiz.erreurChargement')));
    return () => {
      actif = false;
    };
  }, [id, t]);

  const changerQuestion = (i, question) => setQuiz((q) => ({ ...q, questions: q.questions.map((x, j) => (j === i ? question : x)) }));
  const retirerQuestion = (i) => setQuiz((q) => ({ ...q, questions: q.questions.filter((_, j) => j !== i) }));

  const enregistrer = async () => {
    const probleme = !quiz.titre.trim() ? { cle: 'mesQuiz.titreRequis' } : erreurDuBrouillon(quiz.questions);
    if (probleme) {
      setErreur(t(probleme.cle, { numero: probleme.numero }));
      return;
    }
    setEnvoi(true);
    setErreur('');
    try {
      await quizAPI.modifierQuiz(id, { titre: quiz.titre.trim(), description: quiz.description, questions: quiz.questions.map(versServiceQuiz) });
      toast.success(t('mesQuiz.enregistre', { titre: quiz.titre.trim() }));
      enregistre?.();
      fermer();
    } catch (e) {
      setErreur(e?.message || t('mesQuiz.erreurEnregistrement'));
    } finally {
      setEnvoi(false);
    }
  };

  const modifiable = quiz?.modifiable;
  return (
    <Dialog open={Boolean(id)} onClose={envoi ? undefined : fermer} fullWidth maxWidth="md">
      <DialogTitle>{t('mesQuiz.modifierTitre')}</DialogTitle>
      <DialogContent dividers>
        {erreur && <Alert severity="error" sx={{ mb: 2 }}>{erreur}</Alert>}
        {!quiz && !erreur && <Skeleton variant="rectangular" height={240} />}
        {quiz && !modifiable && <Alert severity="info">{t('mesQuiz.nonModifiable')}</Alert>}
        {quiz && modifiable && (
          <Stack spacing={2}>
            <TextField label={t('jeux.quizIa.titreQuiz')} value={quiz.titre} onChange={(e) => setQuiz((q) => ({ ...q, titre: e.target.value }))} inputProps={{ maxLength: 300 }} required fullWidth />
            <Alert severity="info" variant="outlined">{t('mesQuiz.aide')}</Alert>
            {quiz.questions.map((question, i) => (
              <QuestionBrouillon key={i} numero={i + 1} question={question} changer={(q) => changerQuestion(i, q)} supprimer={() => retirerQuestion(i)} occupe={envoi} peutRegenerer={false} />
            ))}
            <Box>
              <Button startIcon={<Add />} disabled={quiz.questions.length >= QUESTIONS_MAX} onClick={() => setQuiz((q) => ({ ...q, questions: [...q.questions, questionVide()] }))}>
                {t('mesQuiz.ajouterQuestion')}
              </Button>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={fermer} disabled={envoi}>{t('common.cancel')}</Button>
        {modifiable && (
          <Button variant="contained" onClick={enregistrer} disabled={envoi} startIcon={envoi ? <CircularProgress size={16} color="inherit" /> : null}>
            {t('mesQuiz.enregistrer')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
