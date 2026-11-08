import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import { studioAPI } from '../../../services/studioApi';
import { ds } from '../../../design-system/tokens';
import { Capitales, LignePanneau } from '../../jeux/Panneau';
import { boutonPanneau, boutonPanneauPlein } from '../../jeux/styles';
import OuvrirPassationDialog from '../../studio/editeur/OuvrirPassationDialog';
import { pretADiffuser } from '../../studio/outils';

// Le panneau reste court : les autres quiz sont dans « Mes quiz »
const NOMBRE_MAX = 6;

/**
 * Lignes « Dans Planner » du panneau « Mes quiz » de la page Activités : les quiz du Studio, les
 * plus récemment modifiés d'abord. Un quiz prêt se diffuse d'ici (code et QR code) ; les autres
 * s'ouvrent dans l'éditeur. Rien n'est affiché si l'enseignant n'en a aucun.
 */
export default function ListeQuizStudio({ onNombre }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState([]);
  const [aDiffuser, setADiffuser] = useState(null);

  // onNombre : le panneau n'annonce « aucun quiz » que si le Studio n'en a pas non plus
  const charger = useCallback(() => {
    studioAPI
      .lister()
      .then((r) => (Array.isArray(r) ? r : []))
      .catch(() => [])
      .then((liste) => {
        setQuiz(liste);
        onNombre?.(liste.length);
      });
  }, [onNombre]);

  useEffect(() => {
    charger();
  }, [charger]);

  if (!quiz.length) return null;

  return (
    <>
      <LignePanneau>
        <Capitales sx={{ display: 'block', fontSize: '0.75rem', color: ds.board.letterDim, letterSpacing: '0.12em' }}>{t('mesQuiz.dansPlanner')}</Capitales>
      </LignePanneau>
      {quiz.slice(0, NOMBRE_MAX).map((q) => (
        <LignePanneau
          key={q.id_questionnaire}
          action={
            pretADiffuser(q) ? (
              <Button size="small" variant="contained" sx={boutonPanneauPlein} onClick={() => setADiffuser(q)} aria-label={t('mesQuiz.diffuserQuiz', { titre: q.titre })}>
                {t('studio.banque.diffuser')}
              </Button>
            ) : (
              <Button size="small" variant="outlined" sx={boutonPanneau} onClick={() => navigate(`/studio-quiz/${q.id_questionnaire}`)}>
                {t('mesQuiz.ouvrir')}
              </Button>
            )
          }
        >
          <Box sx={{ fontWeight: 600 }}>{q.titre}</Box>
          <Typography variant="body2" sx={{ color: ds.board.letterDim }}>
            {t('quizDirect.lancer.questions', { count: q.nb_questions ?? 0 })}
            {q.passations_ouvertes > 0 ? ` · ${t('studio.banque.passationsOuvertes', { count: q.passations_ouvertes })}` : ''}
          </Typography>
        </LignePanneau>
      ))}
      {quiz.length > NOMBRE_MAX && (
        <LignePanneau>
          <Button size="small" variant="text" onClick={() => navigate('/studio-quiz')} sx={{ color: ds.board.letter }}>
            {t('mesQuiz.tous', { count: quiz.length })}
          </Button>
        </LignePanneau>
      )}
      {aDiffuser && <OuvrirPassationDialog ouvert onFermer={() => setADiffuser(null)} quiz={aDiffuser} onOuverte={charger} />}
    </>
  );
}
