import { Box } from '@mui/material';
import { ds } from '../tokens';

/**
 * Caractères posés sur des tuiles de volet (charnière au milieu), pour les horaires
 * et les codes de salle — les seules données qui méritent la matière du panneau.
 * Le texte reste lisible tel quel par les lecteurs d'écran.
 */
export default function FlapTiles({ value, size = '1rem', variant = 'board', color, sx }) {
  const text = String(value ?? '');
  const isBoard = variant === 'board';

  return (
    <Box
      component="span"
      aria-label={text}
      role="text"
      sx={{
        display: 'inline-flex',
        gap: '0.08em',
        fontFamily: ds.font.board,
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1,
        textTransform: 'uppercase',
        color: color || (isBoard ? ds.board.letter : ds.colors.text.primary),
        ...sx,
      }}
    >
      {Array.from(text).map((char, i) => {
        const isSeparator = char === ':' || char === ' ' || char === '-' || char === '.';
        return (
          <Box
            component="span"
            aria-hidden="true"
            // Position stable : le texte d'une tuile ne change qu'avec la valeur entière
            key={i}
            sx={{
              position: 'relative',
              display: 'inline-grid',
              placeItems: 'center',
              minWidth: isSeparator ? '0.32em' : '0.72em',
              height: '1.32em',
              px: isSeparator ? 0 : '0.06em',
              borderRadius: '2px',
              bgcolor: isSeparator ? 'transparent' : isBoard ? ds.board.cell : ds.colors.bg.subtle,
              // Charnière horizontale du volet
              '&::after': isSeparator
                ? undefined
                : {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: '50%',
                    height: '1px',
                    bgcolor: isBoard ? ds.board.cellHinge : 'rgba(13, 19, 38, 0.08)',
                  },
            }}
          >
            {char}
          </Box>
        );
      })}
    </Box>
  );
}
