import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItemButton, ListItemText, Skeleton } from '@mui/material';
import { quizAPI } from '../../services/api';

/**
 * Lancer un quiz en direct pour la séance en cours (quiz-ia.md, lots CQ-1 et CQ-2) : la liste de
 * mes quiz, un clic sur l'un d'eux. Planner démarre la partie, la rattache à la séance, prévient
 * les étudiants, puis ouvre l'écran à projeter. Trois gestes en tout jusqu'à la première question :
 * « Lancer un quiz », le quiz, « Démarrer ».
 */
export default function LancerQuizDialog({ seance, classe, onClose, onCreerAvecIa }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(null); // id du quiz en cours de lancement
  const ouvert = Boolean(seance);

  useEffect(() => {
    if (!ouvert) return undefined;
    let actif = true;
    setQuiz(null);
    setErreur('');
    quizAPI
      .mesQuiz()
      .then((r) => actif && setQuiz(Array.isArray(r?.data) ? r.data : []))
      .catch((e) => actif && setErreur(e?.message || t('quizDirect.lancer.erreurListe')));
    return () => {
      actif = false;
    };
  }, [ouvert, t]);

  const lancer = async (q) => {
    setEnCours(q.id);
    setErreur('');
    try {
      const partie = await quizAPI.lancer({ id_quiz: q.id, id_affectation: seance.id_affectation });
      // Le jeton d'animation voyage dans l'état de navigation, jamais dans l'adresse
      navigate('/quiz/projection', { state: { partie: { ...partie, titre: partie.titre || q.titre } } });
    } catch (e) {
      setErreur(e?.message || t('quizDirect.lancer.erreur'));
      setEnCours(null);
    }
  };

  return (
    <Dialog open={ouvert} onClose={enCours ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('quizDirect.lancer.titre', { classe })}</DialogTitle>
      <DialogContent dividers>
        {erreur && <Alert severity="error" sx={{ mb: 2 }}>{erreur}</Alert>}
        {quiz === null && !erreur && <Skeleton variant="rectangular" height={120} />}
        {quiz?.length === 0 && <Alert severity="info">{t('quizDirect.lancer.aucun')}</Alert>}
        {quiz?.length > 0 && (
          <List disablePadding aria-label={t('quizDirect.lancer.liste')}>
            {quiz.map((q) => (
              <ListItemButton key={q.id} onClick={() => lancer(q)} disabled={Boolean(enCours)} sx={{ borderRadius: 1 }}>
                <ListItemText primary={q.titre} secondary={t('quizDirect.lancer.questions', { count: q.nb_questions ?? 0 })} />
                {enCours === q.id && <CircularProgress size={20} aria-label={t('quizDirect.lancer.enCours')} />}
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        {onCreerAvecIa && (
          <Button onClick={onCreerAvecIa} disabled={Boolean(enCours)} sx={{ mr: 'auto' }}>
            {t('quizDirect.lancer.creerIa')}
          </Button>
        )}
        <Button onClick={onClose} disabled={Boolean(enCours)}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
}
