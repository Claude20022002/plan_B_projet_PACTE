import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import { classement } from '../../../utils/animationQuiz';
import { ds } from '../../../design-system/tokens';

// Le podium projeté se lit de loin : au-delà, la liste complète est dans les résultats de la partie
const PODIUM = 10;

/**
 * Classement final projeté : les dix premiers joueurs et leurs points. Les scores partent vers
 * Planner à ce moment (étudiant, module, groupes de TP) ; le détail est sur la page des résultats.
 */
export default function ClassementFinal({ resultats, joueurs, onTerminer }) {
  const { t } = useTranslation();
  const lignes = classement(resultats, joueurs).slice(0, PODIUM);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, maxWidth: 900, width: '100%', mx: 'auto' }}>
      <Typography component="h2" sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(1.75rem, 5.5vh, 3.5rem)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {t('quizDirect.classementFinal')}
      </Typography>
      {lignes.length === 0 ? (
        <Typography sx={{ color: ds.board.letterDim }}>{t('quizDirect.aucunScore')}</Typography>
      ) : (
        <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1 }}>
          {lignes.map((l, i) => (
            <Box component="li" key={l.nom} sx={{ display: 'grid', gridTemplateColumns: '3ch minmax(0, 1fr) auto', alignItems: 'center', gap: 2, px: 2, py: 1.25, borderRadius: `${ds.radius.md}px`, bgcolor: ds.board.cell, border: `1px solid ${i === 0 ? ds.board.live : ds.board.seam}` }}>
              <Typography sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(1.25rem, 3.5vh, 2rem)', color: ds.board.letterDim, fontVariantNumeric: 'tabular-nums' }}>{i + 1}</Typography>
              <Typography noWrap sx={{ fontWeight: 600, fontSize: 'clamp(1.125rem, 3.2vh, 1.875rem)' }}>{l.nom}</Typography>
              <Typography sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(1.25rem, 3.5vh, 2rem)', fontVariantNumeric: 'tabular-nums' }}>
                {t('quizDirect.points', { count: l.points })}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
      <Box>
        <Button variant="outlined" onClick={onTerminer} sx={{ color: ds.board.letter, borderColor: ds.board.seam, '&:hover': { borderColor: ds.board.letterDim } }}>
          {t('quizDirect.terminer')}
        </Button>
      </Box>
    </Box>
  );
}
