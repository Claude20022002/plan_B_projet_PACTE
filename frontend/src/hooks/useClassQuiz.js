import { useEffect, useState } from 'react';
import { sourceClassQuiz } from '../services/classQuiz';
import { ETEINT } from '../../../shared/classQuiz.js';

/**
 * ClassQuiz est-il ouvert pour l'école ? (lot ME-0c, règles C-1 à C-3). Rend
 * { pret, actif, url, peutLancer } : tant que la configuration n'est pas lue (`pret` faux), et
 * après une erreur, ClassQuiz est éteint. Les écrans n'affichent leurs entrées ClassQuiz que si
 * `actif` est vrai.
 */
export default function useClassQuiz() {
  const [etat, setEtat] = useState({ pret: false, ...ETEINT });

  useEffect(() => {
    let monte = true;
    sourceClassQuiz.lire().then((e) => monte && setEtat({ pret: true, ...e }));
    return () => {
      monte = false;
    };
  }, []);

  return etat;
}
