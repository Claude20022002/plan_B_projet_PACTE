import { Box } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { styleReponse } from '../../../../shared/quiz/couleurs.js';
import { ds } from '../tokens';
import Forme from './Forme';

/**
 * Tuile de réponse de la salle de jeu (DESIGN.md, Salle de jeu) : couleur et forme de la réponse de
 * rang `rang`, texte en grand. `etat` : « normal », « juste » (coche, contour) ou « eteinte » (une
 * autre réponse était la bonne). `couleur` : couleur choisie dans l'éditeur du quiz, si elle existe.
 */
export default function TuileReponse({ rang, texte, couleur, etat = 'normal', children }) {
  const { t } = useTranslation();
  const style = styleReponse(rang, couleur);
  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        minHeight: 88,
        px: { xs: 2, md: 2.5 },
        py: 1.5,
        borderRadius: `${ds.radius.lg}px`,
        bgcolor: style.couleur,
        color: style.encre,
        fontWeight: 700,
        fontSize: 'clamp(1.1rem, 3vh, 1.875rem)',
        lineHeight: 1.2,
        boxShadow: etat === 'juste' ? ds.shadow.raised : 'none',
        outline: etat === 'juste' ? `4px solid ${ds.jeu.bonne}` : 'none',
        outlineOffset: 3,
        opacity: etat === 'eteinte' ? 0.35 : 1,
        transition: 'opacity 250ms ease, box-shadow 250ms ease',
        overflow: 'hidden',
      }}
    >
      <Forme forme={style.forme} taille="clamp(28px, 5vh, 44px)" />
      <Box sx={{ flexGrow: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{texte}</Box>
      {children}
      {etat === 'juste' && <CheckCircle aria-label={t('quizDirect.bonneReponse')} sx={{ fontSize: 'clamp(28px, 5vh, 44px)' }} />}
    </Box>
  );
}
