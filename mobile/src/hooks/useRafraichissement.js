import { useEffect, useEffectEvent } from 'react';
import { AppState } from 'react-native';
import { RAFRAICHISSEMENT_MS } from '../config';

/**
 * Relit les données au retour au premier plan, puis chaque minute tant que l'application est
 * affichée (équivalent de useLiveRefresh du web). Rien en arrière-plan : batterie et données.
 */
export default function useRafraichissement(charger, intervalle = RAFRAICHISSEMENT_MS) {
  // Toujours la dernière version de charger, sans relancer la minuterie à chaque rendu
  const relire = useEffectEvent(() => charger({ silencieux: true }));

  useEffect(() => {
    let minuterie = setInterval(relire, intervalle);
    const abonnement = AppState.addEventListener('change', (etat) => {
      clearInterval(minuterie);
      if (etat === 'active') {
        relire();
        minuterie = setInterval(relire, intervalle);
      }
    });
    return () => {
      clearInterval(minuterie);
      abonnement.remove();
    };
  }, [intervalle]);
}
