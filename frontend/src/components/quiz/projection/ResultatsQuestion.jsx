import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import { CheckCircle, EmojiEvents, NavigateNext } from '@mui/icons-material';
import { COULEURS_REPONSES } from '../../../../../shared/quiz/couleurs.js';
import { decompte, texteSimple } from '../../../utils/animationQuiz';
import { ds } from '../../../design-system/tokens';

/**
 * Résultats projetés d'une question : le nombre de réponses par choix, la bonne réponse mise en
 * avant (usage de l'école, espace-enseignant.md, § 4). Un type sans choix (texte, intervalle,
 * ordre) n'affiche que le nombre de réponses. Puis question suivante, ou classement final.
 */
export default function ResultatsQuestion({ question, reponses, derniere, onSuivant }) {
  const { t } = useTranslation();
  const { parChoix, total } = decompte(question, reponses);
  const plus = Math.max(1, ...(parChoix ?? []).map((c) => c.nombre));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
      <Typography component="h2" sx={{ fontWeight: 700, fontSize: 'clamp(1.25rem, 4vh, 2.5rem)', lineHeight: 1.2 }}>
        {texteSimple(question?.question)}
      </Typography>

      {parChoix ? (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1.25 }}>
          {parChoix.map((c, i) => (
            <Box component="li" key={i} sx={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', alignItems: 'center', gap: 2 }}>
              <Box sx={{ position: 'relative', minHeight: 56, borderRadius: `${ds.radius.lg}px`, bgcolor: ds.board.cell, overflow: 'hidden', outline: c.juste ? `3px solid ${ds.board.live}` : 'none' }}>
                {/* Barre proportionnelle au nombre de réponses */}
                <Box aria-hidden sx={{ position: 'absolute', inset: 0, width: `${(c.nombre / plus) * 100}%`, bgcolor: COULEURS_REPONSES[i % COULEURS_REPONSES.length], opacity: c.juste ? 1 : 0.55, transition: 'width 400ms ease-out', '@media (prefers-reduced-motion: reduce)': { transition: 'none' } }} />
                <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.5, color: '#FFFFFF', fontWeight: 600, fontSize: 'clamp(1rem, 2.8vh, 1.75rem)' }}>
                  {c.juste && <CheckCircle aria-label={t('quizDirect.bonneReponse')} />}
                  <span>{c.texte}</span>
                </Box>
              </Box>
              <Typography sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(1.5rem, 4.5vh, 3rem)', fontVariantNumeric: 'tabular-nums', minWidth: '2ch', textAlign: 'right' }}>
                {c.nombre}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography sx={{ fontSize: 'clamp(1rem, 2.6vh, 1.5rem)', color: ds.board.letterDim }}>{t('quizDirect.reponses', { count: total })}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          variant="contained"
          size="large"
          startIcon={derniere ? <EmojiEvents /> : null}
          endIcon={derniere ? null : <NavigateNext />}
          onClick={onSuivant}
          sx={{ bgcolor: ds.board.letter, color: ds.board.ground, '&:hover': { bgcolor: ds.board.letter, opacity: 0.88 } }}
        >
          {t(derniere ? 'quizDirect.classementFinal' : 'quizDirect.suivant')}
        </Button>
      </Box>
    </Box>
  );
}
