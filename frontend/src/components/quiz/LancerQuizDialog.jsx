import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItemButton, ListItemText, ListSubheader, Skeleton } from '@mui/material';
import { quizAPI } from '../../services/api';
import { studioAPI } from '../../services/studioApi';
import OuvrirPassationDialog from '../studio/editeur/OuvrirPassationDialog';
import { pretADiffuser } from '../studio/outils';

/**
 * Lancer un quiz pour la séance (quiz-ia.md, lots CQ-1 et CQ-2). Deux sortes de quiz :
 *  - du Studio (« Mes quiz » de Planner) : chacun répond à son rythme ; un clic ouvre la
 *    passation, avec son code et son QR code à projeter ;
 *  - en direct (service de quiz) : un clic, Planner démarre la partie, la rattache à la séance,
 *    prévient les étudiants, puis ouvre l'écran à projeter.
 * Sans quiz adapté, « Créer un quiz » est à un geste.
 */
export default function LancerQuizDialog({ ouvert: ouvertDemande, seance = null, classe = '', onClose, onCreer }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [studio, setStudio] = useState(null);
  const [erreur, setErreur] = useState('');
  const [enCours, setEnCours] = useState(null); // id du quiz en cours de lancement
  const [aDiffuser, setADiffuser] = useState(null); // quiz du Studio dont on ouvre une passation
  // Ouvert par « ouvert », ou dès qu'une séance est désignée (Mes classes)
  const ouvert = Boolean(ouvertDemande ?? seance);

  useEffect(() => {
    if (!ouvert) return undefined;
    let actif = true;
    setQuiz(null);
    setStudio(null);
    setErreur('');
    // Le service de quiz peut être absent ou en panne : les quiz du Studio restent proposés
    quizAPI
      .mesQuiz()
      .then((r) => actif && setQuiz(Array.isArray(r?.data) ? r.data : []))
      .catch(() => actif && setQuiz([]));
    studioAPI
      .lister()
      .then((r) => actif && setStudio((Array.isArray(r) ? r : []).filter(pretADiffuser)))
      .catch(() => actif && setStudio([]));
    return () => {
      actif = false;
    };
  }, [ouvert]);

  const lancer = async (q) => {
    setEnCours(q.id);
    setErreur('');
    try {
      const partie = await quizAPI.lancer({ id_quiz: q.id, id_affectation: seance?.id_affectation ?? null });
      // Le jeton d'animation voyage dans l'état de navigation, jamais dans l'adresse
      navigate('/quiz/projection', { state: { partie: { ...partie, titre: partie.titre || q.titre } } });
    } catch (e) {
      setErreur(e?.message || t('quizDirect.lancer.erreur'));
      setEnCours(null);
    }
  };

  const charge = quiz !== null && studio !== null;
  const aucun = charge && !quiz.length && !studio.length;

  return (
    <>
      <Dialog open={ouvert && !aDiffuser} onClose={enCours ? undefined : onClose} fullWidth maxWidth="sm">
        <DialogTitle>{classe ? t('quizDirect.lancer.titre', { classe }) : t('board.launchQuiz')}</DialogTitle>
        <DialogContent dividers>
          {erreur && <Alert severity="error" sx={{ mb: 2 }}>{erreur}</Alert>}
          {!charge && <Skeleton variant="rectangular" height={120} />}
          {aucun && <Alert severity="info">{t('quizDirect.lancer.aucun')}</Alert>}
          {charge && !aucun && (
            <List disablePadding aria-label={t('quizDirect.lancer.liste')}>
              {studio.length > 0 && <ListSubheader disableSticky>{t('quizDirect.lancer.studio')}</ListSubheader>}
              {studio.map((q) => (
                <ListItemButton key={`s${q.id_questionnaire}`} onClick={() => setADiffuser(q)} disabled={Boolean(enCours)} sx={{ borderRadius: 1 }}>
                  <ListItemText primary={q.titre} secondary={t('quizDirect.lancer.questions', { count: q.nb_questions ?? 0 })} />
                </ListItemButton>
              ))}
              {quiz.length > 0 && studio.length > 0 && <ListSubheader disableSticky>{t('quizDirect.lancer.direct')}</ListSubheader>}
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
          {onCreer && (
            <Button onClick={onCreer} disabled={Boolean(enCours)} sx={{ mr: 'auto' }}>
              {t('quizDirect.lancer.creerIa')}
            </Button>
          )}
          <Button onClick={onClose} disabled={Boolean(enCours)}>{t('common.cancel')}</Button>
        </DialogActions>
      </Dialog>
      {aDiffuser && (
        <OuvrirPassationDialog
          ouvert
          quiz={aDiffuser}
          onOuverte={() => {}}
          onFermer={() => {
            setADiffuser(null);
            onClose?.();
          }}
        />
      )}
    </>
  );
}
