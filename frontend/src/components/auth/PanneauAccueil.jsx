import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ds } from '../../design-system/tokens';
import { FlapTiles } from '../../design-system/board';

/**
 * Panneau de présentation des écrans publics (connexion, mot de passe) : ce que l'outil affiche,
 * en lignes fixes de panneau. Pas de rotation automatique (la bascule signale un vrai changement,
 * jamais une décoration).
 */
export default function PanneauAccueil() {
  const { t } = useTranslation();
  const lines = t('login.boardLines', { returnObjects: true });

  return (
    <Box sx={{ bgcolor: ds.board.frame, p: '10px', borderRadius: `${ds.radius.lg}px`, width: '100%', maxWidth: 560 }}>
      <Box sx={{ px: 1, pb: 1.25, display: 'flex', justifyContent: 'space-between', color: ds.nav.letter, fontFamily: ds.font.board, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        <span>{t('login.boardTitle')}</span>
        <span>HESTIM</span>
      </Box>
      <Box sx={{ bgcolor: ds.board.ground, borderRadius: `${ds.radius.md}px`, px: { md: 3, lg: 4 }, py: 4 }}>
        <FlapTiles value="HESTIM" size="clamp(2.25rem, 4.4vw, 3.75rem)" />
        <Box sx={{ mt: 1.25 }}>
          <FlapTiles value="PLANNER" size="clamp(2.25rem, 4.4vw, 3.75rem)" color={ds.brand.orange} />
        </Box>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, mt: 4, p: 0, borderTop: `1px solid ${ds.board.seam}` }}>
          {lines.map((line, i) => (
            <Box
              component="li"
              key={line}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                py: 1.25,
                borderBottom: `1px solid ${ds.board.seam}`,
                fontFamily: ds.font.board,
                fontWeight: 600,
                fontSize: { md: '1.125rem', lg: '1.25rem' },
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: ds.board.letter,
              }}
            >
              <Box component="span" aria-hidden="true" sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: i === 0 ? ds.board.live : ds.board.letterDim }} />
              {line}
            </Box>
          ))}
        </Box>
        <Typography sx={{ mt: 3, color: ds.board.letterDim, fontSize: '0.9375rem' }}>
          {t('app.school')}
        </Typography>
      </Box>
    </Box>
  );
}
