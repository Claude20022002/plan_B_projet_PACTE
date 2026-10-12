import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import { quizAPI } from '../../../services/api';
import { ds } from '../../../design-system/tokens';
import { Capitales, LignePanneau } from '../../jeux/Panneau';
import { boutonPanneau } from '../../jeux/styles';
import EditerQuizDialog from './EditerQuizDialog';

/**
 * Lignes « Dans le service de quiz » du panneau « Mes quiz » (IA-5) : tous les quiz de l'enseignant,
 * générés par l'IA ou faits à la main, les plus récemment modifiés d'abord, chacun modifiable depuis
 * Planner. Rien n'est affiché si le service de quiz n'en a aucun ou ne répond pas.
 */
export default function ListeMesQuiz() {
  const { t, i18n } = useTranslation();
  const [quiz, setQuiz] = useState([]);
  const [ouvert, setOuvert] = useState(null);

  const charger = useCallback(() => {
    quizAPI
      .mesQuiz()
      .then((r) => setQuiz(Array.isArray(r?.data) ? r.data : []))
      .catch(() => setQuiz([]));
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  if (!quiz.length) return null;
  const date = (iso) => (iso ? new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }) : '');

  return (
    <>
      <LignePanneau>
        <Capitales sx={{ display: 'block', fontSize: '0.75rem', color: ds.board.letterDim, letterSpacing: '0.12em' }}>{t('mesQuiz.dansLeService')}</Capitales>
      </LignePanneau>
      {quiz.map((q) => (
        <LignePanneau
          key={q.id}
          action={
            <Button size="small" variant="outlined" sx={boutonPanneau} onClick={() => setOuvert(q.id)} aria-label={t('mesQuiz.modifierQuiz', { titre: q.titre })}>
              {t('mesQuiz.modifier')}
            </Button>
          }
        >
          <Box sx={{ fontWeight: 600 }}>{q.titre}</Box>
          <Typography variant="body2" sx={{ color: ds.board.letterDim }}>
            {[t('quizDirect.lancer.questions', { count: q.nb_questions ?? 0 }), q.modifie_le && t('mesQuiz.modifieLe', { date: date(q.modifie_le) })].filter(Boolean).join(' · ')}
          </Typography>
        </LignePanneau>
      ))}
      <EditerQuizDialog id={ouvert} fermer={() => setOuvert(null)} enregistre={charger} />
    </>
  );
}
