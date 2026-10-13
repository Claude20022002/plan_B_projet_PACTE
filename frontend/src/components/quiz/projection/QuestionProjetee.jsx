import { useTranslation } from 'react-i18next';
import { Box, Button, LinearProgress, Typography } from '@mui/material';
import { NavigateNext, Visibility } from '@mui/icons-material';
import { texteSimple } from '../../../utils/animationQuiz';
import { carteSx } from '../../../design-system/cartes';
import { Minuteur, TuileReponse } from '../../../design-system/jeu';

/**
 * Question projetée pendant un quiz en direct : le texte dans une carte, le minuteur, les réponses
 * en tuiles aux couleurs et aux formes que les téléphones affichent, et le nombre de réponses reçues.
 * À la fin du temps, les réponses s'affichent seules ; « Voir les réponses » les montre plus tôt.
 * Une diapositive n'a ni temps ni réponses : l'enseignant passe à la suite.
 */
export default function QuestionProjetee({ question, numero, total, restant, reponsesRecues, nbJoueurs, diapositive, onVoir, onSuivant }) {
  const { t } = useTranslation();
  const choix = Array.isArray(question?.answers) ? question.answers : [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3 } }}>
        <Box sx={{ ...carteSx, flexGrow: 1, minWidth: 0, px: { xs: 2, md: 3 }, py: { xs: 2, md: 2.5 } }}>
          <Typography sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 'clamp(0.95rem, 2.2vh, 1.375rem)' }}>{t('quizDirect.numero', { numero, total })}</Typography>
          <Typography component="h2" sx={{ mt: 0.5, fontWeight: 700, fontSize: 'clamp(1.5rem, 5vh, 3.25rem)', lineHeight: 1.2, overflowWrap: 'anywhere' }}>
            {texteSimple(question?.question)}
          </Typography>
        </Box>
        {restant !== null && <Minuteur restant={restant} total={Number(question?.time) || 0} />}
      </Box>

      {!diapositive && choix.length > 0 && (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          {choix.map((c, i) => (
            <Box component="li" key={i}>
              <TuileReponse rang={i} couleur={c.color} texte={texteSimple(c.answer)} />
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        {!diapositive && (
          <Box sx={{ minWidth: 240, flexGrow: 1, maxWidth: 520 }}>
            <Typography aria-live="polite" sx={{ fontWeight: 600, fontSize: 'clamp(1rem, 2.6vh, 1.5rem)', fontVariantNumeric: 'tabular-nums' }}>
              {t('quizDirect.reponsesRecues', { recues: reponsesRecues, joueurs: nbJoueurs })}
            </Typography>
            <LinearProgress variant="determinate" value={nbJoueurs > 0 ? Math.min(100, (reponsesRecues / nbJoueurs) * 100) : 0} sx={{ mt: 1, height: 10, borderRadius: 999 }} />
          </Box>
        )}
        <Box sx={{ flexGrow: 1 }} />
        {diapositive ? (
          <Button variant="contained" size="large" endIcon={<NavigateNext />} onClick={onSuivant} sx={{ minHeight: 56, px: 4, fontSize: 'clamp(1.05rem, 2.4vh, 1.375rem)' }}>
            {t('quizDirect.suivant')}
          </Button>
        ) : (
          <Button variant="contained" size="large" startIcon={<Visibility />} onClick={onVoir} sx={{ minHeight: 56, px: 4, fontSize: 'clamp(1.05rem, 2.4vh, 1.375rem)' }}>
            {t('quizDirect.voirReponses')}
          </Button>
        )}
      </Box>
    </Box>
  );
}
