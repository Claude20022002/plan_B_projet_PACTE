import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import { NavigateNext, Visibility } from '@mui/icons-material';
import { COULEURS_REPONSES } from '../../../../../shared/quiz/couleurs.js';
import { texteSimple } from '../../../utils/animationQuiz';
import { ds } from '../../../design-system/tokens';

/**
 * Question projetée pendant un quiz en direct : le texte, les réponses aux couleurs que les
 * téléphones affichent, le temps restant et le nombre de réponses reçues. À la fin du temps, les
 * réponses s'affichent seules ; « Voir les réponses » les montre plus tôt. Une diapositive n'a ni
 * temps ni réponses : l'enseignant passe à la suite.
 */
export default function QuestionProjetee({ question, numero, total, restant, reponsesRecues, nbJoueurs, diapositive, onVoir, onSuivant }) {
  const { t } = useTranslation();
  const choix = Array.isArray(question?.answers) ? question.answers : [];
  const boutonClair = { bgcolor: ds.board.letter, color: ds.board.ground, '&:hover': { bgcolor: '#FFFFFF' } };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 2 }}>
        <Typography sx={{ color: ds.board.letterDim, fontSize: 'clamp(1rem, 2.4vh, 1.5rem)' }}>
          {t('quizDirect.numero', { numero, total })}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {restant !== null && (
          <Typography aria-live="off" sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(2rem, 7vh, 4.5rem)', fontVariantNumeric: 'tabular-nums', lineHeight: 1, color: restant <= 5 ? ds.brand.orange : ds.board.letter }}>
            {restant}
          </Typography>
        )}
      </Box>

      <Typography component="h2" sx={{ fontWeight: 700, fontSize: 'clamp(1.5rem, 5vh, 3.25rem)', lineHeight: 1.2 }}>
        {texteSimple(question?.question)}
      </Typography>

      {!diapositive && choix.length > 0 && (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {choix.map((c, i) => (
            <Box component="li" key={i} sx={{ px: 2, py: 2, borderRadius: `${ds.radius.lg}px`, bgcolor: COULEURS_REPONSES[i % COULEURS_REPONSES.length], color: '#FFFFFF', fontWeight: 600, fontSize: 'clamp(1.125rem, 3.2vh, 2rem)' }}>
              {texteSimple(c.answer)}
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        {!diapositive && (
          <Typography aria-live="polite" sx={{ fontSize: 'clamp(1rem, 2.6vh, 1.5rem)', fontVariantNumeric: 'tabular-nums' }}>
            {t('quizDirect.reponsesRecues', { recues: reponsesRecues, joueurs: nbJoueurs })}
          </Typography>
        )}
        <Box sx={{ flexGrow: 1 }} />
        {diapositive ? (
          <Button variant="contained" size="large" endIcon={<NavigateNext />} onClick={onSuivant} sx={boutonClair}>
            {t('quizDirect.suivant')}
          </Button>
        ) : (
          <Button variant="contained" size="large" startIcon={<Visibility />} onClick={onVoir} sx={boutonClair}>
            {t('quizDirect.voirReponses')}
          </Button>
        )}
      </Box>
    </Box>
  );
}
