import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@mui/system';
import { ds } from '../tokens';

/**
 * Texte à volets : quand la valeur change, chaque caractère bascule à son tour
 * (cascade décalée), comme sur un panneau de départs. C'est l'unique animation
 * signature du produit : elle signale un changement d'état, jamais une décoration.
 *
 * - Lecteurs d'écran : le texte complet est exposé une seule fois, les volets sont masqués.
 * - prefers-reduced-motion : mise à jour instantanée, sans bascule.
 */

const flip = keyframes`
  0%   { transform: rotateX(-88deg); opacity: 0.35; }
  60%  { transform: rotateX(12deg);  opacity: 1; }
  100% { transform: rotateX(0deg);   opacity: 1; }
`;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function FlapText({ value, sx, component = 'span' }) {
  const text = String(value ?? '');
  const [chars, setChars] = useState(() => Array.from(text));
  // Compteur par position : changer la clé remonte le caractère et rejoue la bascule
  const [turns, setTurns] = useState(() => Array.from(text, () => 0));
  const timers = useRef([]);
  const previous = useRef(text);

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
      const id = setTimeout(() => {
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
      }, i * ds.motion.flapStepMs);
      timers.current.push(id);
    });

    return () => timers.current.forEach(clearTimeout);
  }, [text]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return (
    <Box component={component} sx={{ display: 'inline-block', perspective: '400px', ...sx }}>
      <Box
        component="span"
        sx={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(0 0 0 0)',
          whiteSpace: 'nowrap',
        }}
      >
        {text}
      </Box>
      <span aria-hidden="true">
        {chars.map((char, i) => (
          <Box
            component="span"
            // La position est l'identité d'un volet ; le compteur relance la bascule
            key={`${i}-${turns[i] ?? 0}`}
            sx={{
              display: 'inline-block',
              whiteSpace: 'pre',
              transformOrigin: '50% 50%',
              animation: turns[i] ? `${flip} 220ms cubic-bezier(0.16, 1, 0.3, 1) both` : 'none',
            }}
          >
            {char}
          </Box>
        ))}
      </span>
    </Box>
  );
}
