import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import { EmojiEvents, NavigateNext } from '@mui/icons-material';
import { styleReponse } from '../../../../../shared/quiz/couleurs.js';
import { decompte, texteSimple } from '../../../utils/animationQuiz';
import { ds } from '../../../design-system/tokens';
import { Forme, TuileReponse } from '../../../design-system/jeu';

/**
 * Résultats projetés d'une question : un histogramme du nombre de réponses par choix (couleur et
 * forme du choix), puis les tuiles avec la bonne réponse mise en avant et les autres éteintes (usage
 * de l'école, espace-enseignant.md, § 4). Un sondage n'a pas de bonne réponse : rien n'est éteint.
 * Un type sans choix (texte, intervalle, ordre) n'affiche que le nombre de réponses.
 */
export default function ResultatsQuestion({ question, reponses, derniere, onSuivant }) {
  const { t } = useTranslation();
  const { parChoix, total } = decompte(question, reponses);
  const plus = Math.max(1, ...(parChoix ?? []).map((c) => c.nombre));
  const unJuste = (parChoix ?? []).some((c) => c.juste);
  const couleur = (i) => question?.answers?.[i]?.color;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
      <Typography component="h2" sx={{ fontWeight: 700, fontSize: 'clamp(1.25rem, 4vh, 2.5rem)', lineHeight: 1.2 }}>
        {texteSimple(question?.question)}
      </Typography>

      {parChoix && (
        <>
          {/* Histogramme : une colonne par choix, hauteur proportionnelle au nombre de réponses */}
          <Box aria-hidden="true" sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: { xs: 1.5, md: 3 }, height: 'clamp(140px, 26vh, 280px)' }}>
            {parChoix.map((c, i) => {
              const style = styleReponse(i, couleur(i));
              return (
                <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', width: 'clamp(56px, 9vw, 120px)' }}>
                  <Typography sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(1.5rem, 4.5vh, 3rem)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{c.nombre}</Typography>
                  <Box sx={{ width: '100%', height: `${Math.max(3, (c.nombre / plus) * 70)}%`, borderRadius: `${ds.radius.md}px ${ds.radius.md}px 0 0`, bgcolor: style.couleur, opacity: unJuste && !c.juste ? 0.45 : 1, transition: 'height 500ms cubic-bezier(0.16, 1, 0.3, 1)' }} />
                  {/* La forme sous la colonne, visible même à 0 réponse */}
                  <Box sx={{ mt: 1, color: style.couleur, opacity: unJuste && !c.juste ? 0.45 : 1 }}>
                    <Forme forme={style.forme} taille="clamp(22px, 3.6vh, 36px)" />
                  </Box>
                </Box>
              );
            })}
          </Box>

          <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: { xs: 1.25, md: 1.75 }, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
            {parChoix.map((c, i) => (
              <Box component="li" key={i}>
                <TuileReponse rang={i} couleur={couleur(i)} texte={c.texte} etat={c.juste ? 'juste' : unJuste ? 'eteinte' : 'normal'}>
                  <Box component="span" sx={{ fontFamily: ds.font.board, fontVariantNumeric: 'tabular-nums' }}>
                    {c.nombre}
                  </Box>
                </TuileReponse>
              </Box>
            ))}
          </Box>
        </>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Typography sx={{ fontSize: 'clamp(1rem, 2.6vh, 1.5rem)', color: 'text.secondary' }}>{t('quizDirect.reponses', { count: total })}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" size="large" startIcon={derniere ? <EmojiEvents /> : null} endIcon={derniere ? null : <NavigateNext />} onClick={onSuivant} sx={{ minHeight: 56, px: 4, fontSize: 'clamp(1.05rem, 2.4vh, 1.375rem)' }}>
          {t(derniere ? 'quizDirect.classementFinal' : 'quizDirect.suivant')}
        </Button>
      </Box>
    </Box>
  );
}
