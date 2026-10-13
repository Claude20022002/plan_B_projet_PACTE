import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import { classement } from '../../../utils/animationQuiz';
import { ds } from '../../../design-system/tokens';
import { ClassementBarres, Podium } from '../../../design-system/jeu';

// Le classement projeté se lit de loin : au-delà, la liste complète est dans les résultats de la partie
const AFFICHES = 10;

/**
 * Classement final projeté : le podium des trois premiers, puis les suivants jusqu'au dixième en
 * barres. Les scores partent vers Planner à ce moment (étudiant, module, groupes de TP) ; le
 * détail est sur la page des résultats.
 */
export default function ClassementFinal({ resultats, joueurs, onTerminer }) {
  const { t } = useTranslation();
  const lignes = classement(resultats, joueurs).slice(0, AFFICHES);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, maxWidth: 1100, width: '100%', mx: 'auto' }}>
      <Typography component="h2" sx={{ fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(1.75rem, 5.5vh, 3.5rem)', textAlign: 'center' }}>
        {t('quizDirect.classementFinal')}
      </Typography>
      {lignes.length === 0 ? (
        <Typography sx={{ color: 'text.secondary', textAlign: 'center' }}>{t('quizDirect.aucunScore')}</Typography>
      ) : (
        <>
          <Podium lignes={lignes} />
          {lignes.length > 3 && <ClassementBarres lignes={lignes.slice(3)} depart={4} />}
        </>
      )}
      <Box sx={{ textAlign: 'center' }}>
        <Button variant="outlined" size="large" onClick={onTerminer}>
          {t('quizDirect.terminer')}
        </Button>
      </Box>
    </Box>
  );
}
