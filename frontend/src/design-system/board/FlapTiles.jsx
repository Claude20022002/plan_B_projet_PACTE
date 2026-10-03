import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';
import { ds } from '../tokens';

/**
 * Caractères posés sur des tuiles de volet (charnière au milieu), pour les horaires
 * et les codes de salle. Quand la valeur change, chaque tuile bascule à son tour :
 * c'est le même geste que FlapText, porté par la matière du panneau.
 * Le texte reste lisible tel quel par les lecteurs d'écran ; mouvement réduit = instantané.
 */

const flip = keyframes`
  0%   { transform: rotateX(-88deg); opacity: 0.35; }
  60%  { transform: rotateX(12deg);  opacity: 1; }
  100% { transform: rotateX(0deg);   opacity: 1; }
`;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function FlapTiles({ value, size = '1rem', variant = 'board', color, sx }) {
  const text = String(value ?? '');
  const isBoard = variant === 'board';
  const [chars, setChars] = useState(() => Array.from(text));
  const [turns, setTurns] = useState(() => Array.from(text, () => 0));
  const previous = useRef(text);
  const timers = useRef([]);

  useEffect(() => {
    if (previous.current === text) return undefined;
    previous.current = text;
    const target = Array.from(text);
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (prefersReducedMotion()) {
      setChars(target);
      setTurns(target.map(() => 0));
      return undefined;
    }

    setChars((current) => target.map((_, i) => current[i] ?? ' '));
    setTurns((current) => target.map((_, i) => current[i] ?? 0));
    target.forEach((char, i) => {
      timers.current.push(
        setTimeout(() => {
          setChars((current) => {
            const next = [...current];
            next[i] = char;
            return next;
          });
          setTurns((current) => {
            const next = [...current];
            next[i] = (next[i] ?? 0) + 1;
            return next;
          });
        }, i * ds.motion.flapStepMs)
      );
    });
    return () => timers.current.forEach(clearTimeout);
  }, [text]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const hinge = isBoard ? ds.board.cellHinge : 'rgba(13, 19, 38, 0.10)';

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
        perspective: '400px',
        ...sx,
      }}
    >
      {chars.map((char, i) => {
        const isSeparator = char === ':' || char === ' ' || char === '-' || char === '.';
        return (
          <Box
            component="span"
            aria-hidden="true"
            // La position est l'identité d'une tuile ; le compteur relance la bascule
            key={`${i}-${turns[i] ?? 0}`}
            sx={{
              position: 'relative',
              display: 'inline-grid',
              placeItems: 'center',
              minWidth: isSeparator ? '0.32em' : '0.72em',
              height: '1.32em',
              px: isSeparator ? 0 : '0.06em',
              borderRadius: '2px',
              bgcolor: isSeparator ? 'transparent' : isBoard ? ds.board.cell : ds.colors.bg.subtle,
              // Charnière horizontale du volet, peinte DERRIÈRE le caractère (le « 0 » reste un 0)
              backgroundImage: isSeparator
                ? 'none'
                : `linear-gradient(to bottom, transparent calc(50% - 0.5px), ${hinge} calc(50% - 0.5px), ${hinge} calc(50% + 0.5px), transparent calc(50% + 0.5px))`,
              transformOrigin: '50% 50%',
              animation: turns[i] ? `${flip} 220ms cubic-bezier(0.16, 1, 0.3, 1) both` : 'none',
            }}
          >
            {char}
          </Box>
        );
      })}
    </Box>
  );
}
