import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { RAFRAICHISSEMENT_MS } from '../config';

/**
 * Relit les données au retour au premier plan, puis chaque minute tant que l'application est
 * affichée (équivalent de useLiveRefresh du web). Rien en arrière-plan : batterie et données.
 */
export default function useRafraichissement(charger, intervalle = RAFRAICHISSEMENT_MS) {
  const rappel = useRef(charger);
  rappel.current = charger;

  useEffect(() => {
    let minuterie = setInterval(() => rappel.current({ silencieux: true }), intervalle);
    const abonnement = AppState.addEventListener('change', (etat) => {
      clearInterval(minuterie);
      if (etat === 'active') {
        rappel.current({ silencieux: true });
        minuterie = setInterval(() => rappel.current({ silencieux: true }), intervalle);
      }
    });
    return () => {
      clearInterval(minuterie);
      abonnement.remove();
    };
  }, [intervalle]);
}
