import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import { quizAPI } from '../../../services/api';
import { Intitule, LignePanneau, Libelle } from '../../jeux/Panneau';
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
        <Libelle sx={{ display: 'block', fontSize: '0.75rem', color: 'text.secondary', letterSpacing: '0.12em' }}>{t('mesQuiz.dansLeService')}</Libelle>
      </LignePanneau>
      {quiz.map((q) => (
        <LignePanneau
          key={q.id}
          action={
            <Button size="small" variant="outlined" onClick={() => setOuvert(q.id)} aria-label={t('mesQuiz.modifierQuiz', { titre: q.titre })}>
              {t('mesQuiz.modifier')}
            </Button>
          }
        >
          <Box sx={{ fontWeight: 600 }}>{q.titre}</Box>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {[t('quizDirect.lancer.questions', { count: q.nb_questions ?? 0 }), q.modifie_le && t('mesQuiz.modifieLe', { date: date(q.modifie_le) })].filter(Boolean).join(' · ')}
          </Typography>
        </LignePanneau>
      ))}
      <EditerQuizDialog id={ouvert} fermer={() => setOuvert(null)} enregistre={charger} />
    </>
  );
}
