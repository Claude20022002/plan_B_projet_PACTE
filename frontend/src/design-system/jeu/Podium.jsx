import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
import { useTranslation } from 'react-i18next';
import { COULEURS_REPONSES } from '../../../../shared/quiz/couleurs.js';
import { ds } from '../tokens';

// Or, argent, bronze : lus partout comme 1er, 2e, 3e
const MARCHES = [
  { fond: '#E8B400', encre: '#0D1326', hauteur: '100%' },
  { fond: '#B9BECB', encre: '#0D1326', hauteur: '72%' },
  { fond: '#C7773B', encre: '#FFFFFF', hauteur: '52%' },
];
// Ordre d'affichage : 2e, 1er, 3e
const ORDRE = [1, 0, 2];

// Confettis : ils tombent puis s'effacent ; sous prefers-reduced-motion (index.css), ils n'apparaissent pas
const chute = keyframes`
  0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
  85% { opacity: 1; }
  100% { transform: translateY(70vh) rotate(540deg); opacity: 0; }
`;
const CONFETTIS = Array.from({ length: 28 }, (_, i) => ({ gauche: (i * 37) % 100, delai: (i % 7) * 0.18, couleur: COULEURS_REPONSES[i % COULEURS_REPONSES.length], large: i % 3 === 0 }));

/** Podium des trois premiers (DESIGN.md, Salle de jeu), avec confettis. `lignes` : [{ nom, points }] triées. */
export default function Podium({ lignes }) {
  const { t } = useTranslation();
  const trois = lignes.slice(0, 3);
  return (
    <Box sx={{ position: 'relative', overflow: 'hidden', pt: 2 }}>
      <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {CONFETTIS.map((c, i) => (
          <Box key={i} sx={{ position: 'absolute', top: 0, left: `${c.gauche}%`, width: c.large ? 12 : 8, height: c.large ? 6 : 12, borderRadius: '2px', bgcolor: c.couleur, opacity: 0, animation: `${chute} 2.6s ${c.delai}s cubic-bezier(0.3, 0.6, 0.5, 1) forwards` }} />
        ))}
      </Box>
      <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', alignItems: 'end', gap: { xs: 1, md: 2 }, height: 'clamp(220px, 42vh, 420px)' }}>
        {ORDRE.filter((rang) => trois[rang]).map((rang) => {
          const l = trois[rang];
          const m = MARCHES[rang];
          return (
            <Box component="li" key={l.nom} value={rang + 1} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', minWidth: 0 }}>
              <Typography noWrap sx={{ maxWidth: '100%', fontWeight: 700, fontSize: 'clamp(1.1rem, 3.4vh, 2rem)' }}>
                {l.nom}
              </Typography>
              <Typography sx={{ mb: 1, color: 'text.secondary', fontVariantNumeric: 'tabular-nums', fontSize: 'clamp(0.95rem, 2.4vh, 1.375rem)' }}>{t('quizDirect.points', { count: l.points })}</Typography>
              <Box sx={{ width: '100%', height: m.hauteur, borderRadius: `${ds.radius.lg}px ${ds.radius.lg}px 0 0`, bgcolor: m.fond, color: m.encre, display: 'grid', placeItems: 'start center', pt: 1.5, fontFamily: ds.font.board, fontWeight: 700, fontSize: 'clamp(2rem, 7vh, 4.5rem)', lineHeight: 1 }}>
                {rang + 1}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
