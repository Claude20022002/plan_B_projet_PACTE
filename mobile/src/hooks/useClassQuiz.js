import { useEffect, useState } from 'react';
import { sourceClassQuiz } from '../quiz/classQuiz';
import { ETEINT } from '../../../shared/classQuiz.js';

/**
 * ClassQuiz est-il ouvert pour l'école ? (lot ME-0c, règles C-1 à C-3). Même contrat que le crochet
 * du site : { pret, actif, url, peutLancer }, éteint tant que la configuration n'est pas lue.
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
