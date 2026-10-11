import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Skeleton, Stack, TextField, Typography } from '@mui/material';
import { quizIaAPI } from '../../../services/api';
import { useToast } from '../../../contexts/ToastContext';
import { erreurDuBrouillon } from '../../../utils/brouillonQuiz';
import QuestionBrouillon from './QuestionBrouillon';

// La génération se suit toutes les deux secondes, jusqu'au brouillon
const SUIVI_MS = 2000;

/**
 * Suivi d'une génération puis relecture du brouillon : l'enseignant corrige, supprime ou fait
 * régénérer une question, puis crée le quiz dans ClassQuiz (rien n'y part sans cette validation).
 * `titreInitial` : le sujet saisi dans « Créer un quiz », proposé comme titre.
 */
export default function RelireQuiz({ id, titreInitial = '', fermer, modifie, donnerEnDevoir }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [etat, setEtat] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [modifiees, setModifiees] = useState(false);
  const [titre, setTitre] = useState('');
  const [occupee, setOccupee] = useState(null); // index de la question en régénération
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  const recevoir = useCallback((e) => {
    setEtat(e);
    setQuestions(e.questions ?? []);
    setModifiees(false);
  }, []);

  // Tant que la génération tourne, son état est redemandé ; ensuite le brouillon appartient à l'écran
  useEffect(() => {
    if (!id) return undefined;
    let actif = true;
    let minuterie = null;
    setEtat(null);
    setErreur('');
    setTitre(titreInitial);
    const lire = async () => {
      try {
        const e = await quizIaAPI.etat(id);
        if (!actif) return;
        recevoir(e);
        if (e.statut === 'en_cours' || e.statut === 'creation') minuterie = setTimeout(lire, SUIVI_MS);
        else modifie();
      } catch (e) {
        if (actif) setErreur(e?.message || t('jeux.erreurAction'));
      }
    };
    lire();
    return () => {
      actif = false;
      clearTimeout(minuterie);
    };
  }, [id, titreInitial, recevoir, modifie, t]);

  const changer = (i, q) => {
    setQuestions((liste) => liste.map((x, j) => (j === i ? q : x)));
    setModifiees(true);
  };
  const supprimer = (i) => {
    setQuestions((liste) => liste.filter((_, j) => j !== i));
    setModifiees(true);
  };

  const probleme = etat?.statut === 'pret' ? erreurDuBrouillon(questions) : null;

  /** Brouillon enregistré s'il a changé ; false si le serveur le refuse. */
  const enregistrer = async () => {
    if (!modifiees) return true;
    try {
      recevoir(await quizIaAPI.enregistrer(id, questions));
      return true;
    } catch (e) {
      setErreur(e?.message || t('jeux.erreurAction'));
      return false;
    }
  };

  const sauver = async () => {
    setEnvoi(true);
    setErreur('');
    if (await enregistrer()) toast.success(t('jeux.quizIa.enregistre'));
    setEnvoi(false);
  };

  const regenerer = async (i) => {
    setErreur('');
    setOccupee(i);
    try {
      // Les corrections en cours sont d'abord enregistrées : la régénération part du brouillon du serveur
      if (await enregistrer()) recevoir(await quizIaAPI.regenerer(id, i));
    } catch (e) {
      setErreur(e?.message || t('jeux.erreurAction'));
    } finally {
      setOccupee(null);
    }
  };

  const creer = async () => {
    setEnvoi(true);
    setErreur('');
    try {
      if (await enregistrer()) {
        const cree = await quizIaAPI.creer(id, titre.trim());
        recevoir(cree);
        toast.success(t('jeux.quizIa.cree', { titre: cree.titre_quiz }));
        modifie();
      }
    } catch (e) {
      setErreur(e?.message || t('jeux.erreurAction'));
    } finally {
      setEnvoi(false);
    }
  };

  const enCours = etat?.statut === 'en_cours' || etat?.statut === 'creation';
  const pret = etat?.statut === 'pret';
  const cree = etat?.statut === 'cree';

  return (
    <Dialog open={Boolean(id)} onClose={envoi ? undefined : fermer} fullWidth maxWidth="md" aria-labelledby="relire-quiz-titre">
      <DialogTitle id="relire-quiz-titre">{t(pret ? 'jeux.quizIa.relire' : 'jeux.quizIa.titre')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {erreur && <Alert severity="error" role="alert">{erreur}</Alert>}
          {!etat && !erreur && <Skeleton variant="rectangular" height={160} />}
          {enCours && (
            <Box role="status" sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 4, justifyContent: 'center' }}>
              <CircularProgress size={28} />
              <Typography>{t(etat.statut === 'creation' ? 'jeux.quizIa.creationEnCours' : 'jeux.quizIa.generationEnCours')}</Typography>
            </Box>
          )}
          {etat?.statut === 'erreur' && <Alert severity="error">{etat.erreur || t('jeux.quizIa.echec')}</Alert>}
          {cree && (
            <Alert severity="success" action={donnerEnDevoir ? <Button color="inherit" size="small" onClick={() => donnerEnDevoir(etat)}>{t('jeux.quizIa.donnerEnDevoir')}</Button> : null}>
              {t('jeux.quizIa.dejaCree', { context: donnerEnDevoir ? undefined : 'sansDevoirs' })}
            </Alert>
          )}
          {pret && (
            <>
              <Alert severity="info">{t('jeux.quizIa.aideRelecture')}</Alert>
              <TextField label={t('jeux.quizIa.titreQuiz')} value={titre} onChange={(e) => setTitre(e.target.value)} inputProps={{ maxLength: 200 }} helperText={t('jeux.quizIa.aideTitre')} />
            </>
          )}
          {(pret || cree) &&
            questions.map((q, i) =>
              pret ? (
                <QuestionBrouillon
                  key={i}
                  numero={i + 1}
                  question={q}
                  changer={(x) => changer(i, x)}
                  supprimer={() => supprimer(i)}
                  regenerer={() => regenerer(i)}
                  occupe={occupee === i}
                  peutRegenerer={occupee === null && !envoi}
                />
              ) : (
                <Paper key={i} variant="outlined" sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: 700 }}>{i + 1}. {q.question}</Typography>
                  {q.reponses.map((r, j) => (
                    <Typography key={j} variant="body2" sx={{ mt: 0.5, fontWeight: r.juste ? 700 : 400 }}>
                      {r.juste ? '✓' : '–'} {r.texte}
                    </Typography>
                  ))}
                </Paper>
              )
            )}
          {probleme && <Alert severity="warning">{t(probleme.cle, { numero: probleme.numero })}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={fermer} disabled={envoi}>{t('common.close')}</Button>
        {pret && (
          <>
            <Button onClick={sauver} disabled={envoi || !modifiees || Boolean(probleme) || occupee !== null}>{t('jeux.quizIa.enregistrer')}</Button>
            <Button variant="contained" onClick={creer} disabled={envoi || Boolean(probleme) || occupee !== null}>
              {t(envoi ? 'jeux.quizIa.creation' : 'jeux.quizIa.creer')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
