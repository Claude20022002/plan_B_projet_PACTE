import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { Fullscreen, FullscreenExit } from '@mui/icons-material';
import SalleAttente from '../components/quiz/projection/SalleAttente';
import QuestionProjetee from '../components/quiz/projection/QuestionProjetee';
import ResultatsQuestion from '../components/quiz/projection/ResultatsQuestion';
import ClassementFinal from '../components/quiz/projection/ClassementFinal';
import useAnimationQuiz from '../hooks/useAnimationQuiz';
import useEcranProjete from '../hooks/useEcranProjete';
import { quizAPI } from '../services/api';
import { adresseRejoindre } from '../utils/animationQuiz';
import { ds } from '../design-system/tokens';
import useTitreOnglet from '../hooks/useTitreOnglet';

/**
 * Quiz en direct, écran à projeter en classe (quiz-ia.md, lot CQ-2), sans le menu de Planner.
 * La partie arrive du lancement (« Lancer un quiz » dans Mes classes), par l'état de navigation :
 * le jeton d'animation n'apparaît jamais dans l'adresse. Déroulé : salle d'attente avec le QR,
 * « Démarrer », puis pour chaque question le compte à rebours et le nombre de réponses par choix,
 * enfin le classement. L'enseignant n'a qu'un bouton à la fois.
 */
export default function QuizProjection() {
  const { t } = useTranslation();
  useTitreOnglet(t('quizDirect.titre'));
  const navigate = useNavigate();
  const partie = useLocation().state?.partie ?? null;
  const [urlQuiz, setUrlQuiz] = useState(null);
  const { pleinEcran, basculerPleinEcran } = useEcranProjete();
  const { etat, question, diapositive, derniere, restant, demarrer, voirReponses, suivant } = useAnimationQuiz(partie?.animation);
  const pin = partie?.animation?.game_pin;

  // Adresse du service de quiz, pour le QR que scanne l'application
  useEffect(() => {
    let actif = true;
    quizAPI
      .getConfig()
      .then((c) => actif && setUrlQuiz(c?.actif ? c.url : null))
      .catch(() => actif && setUrlQuiz(null));
    return () => {
      actif = false;
    };
  }, []);

  const nbQuestions = etat.quiz?.questions?.length ?? partie?.nb_questions ?? 0;
  let contenu;
  if (etat.etape === 'erreur') {
    contenu = <Typography role="alert" sx={{ py: 6, maxWidth: 720, fontSize: 'clamp(1.125rem, 3vh, 1.75rem)' }}>{t(`quizDirect.erreurs.${etat.erreur}`)}</Typography>;
  } else if (etat.etape === 'connexion') {
    contenu = <CircularProgress aria-label={t('quizDirect.connexion')} sx={{ color: ds.board.letter, my: 6 }} />;
  } else if (etat.etape === 'attente') {
    contenu = <SalleAttente pin={pin} adresse={adresseRejoindre(urlQuiz, pin)} joueurs={etat.joueurs} onDemarrer={demarrer} />;
  } else if (etat.etape === 'question') {
    contenu = (
      <QuestionProjetee
        question={question}
        numero={etat.index + 1}
        total={nbQuestions}
        restant={restant}
        reponsesRecues={etat.reponsesRecues}
        nbJoueurs={etat.joueurs.length}
        diapositive={diapositive}
        onVoir={voirReponses}
        onSuivant={suivant}
      />
    );
  } else if (etat.etape === 'resultats') {
    contenu = <ResultatsQuestion question={question} reponses={etat.reponses} derniere={derniere} onSuivant={suivant} />;
  } else {
    contenu = <ClassementFinal resultats={etat.resultats} joueurs={etat.joueurs} onTerminer={() => navigate('/jeux')} />;
  }

  return (
    <Box component="main" sx={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: ds.board.ground, color: ds.board.letter }}>
      {/* Bandeau : le quiz, et le plein écran */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, px: { xs: 2, md: 3 }, py: 1.5, borderBottom: `1px solid ${ds.board.seam}` }}>
        <Typography component="h1" noWrap sx={{ flexGrow: 1, minWidth: 0, fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(1.25rem, 3vh, 2.25rem)', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.15 }}>
          {partie?.titre ?? t('quizDirect.titre')}
        </Typography>
        <Button onClick={basculerPleinEcran} startIcon={pleinEcran ? <FullscreenExit /> : <Fullscreen />} sx={{ color: ds.board.letterDim }}>
          {t(pleinEcran ? 'appel.projection.quitterPleinEcran' : 'appel.projection.pleinEcran')}
        </Button>
      </Box>
      <Box sx={{ flexGrow: 1, minHeight: 0, p: { xs: 2, md: 3 } }}>{contenu}</Box>
    </Box>
  );
}
