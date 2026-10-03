import { useEffect, useRef } from 'react';

/**
 * Rafraîchit des données en arrière-plan : à intervalle régulier et dès que l'onglet
 * redevient visible. Sur le panneau, un report ou un changement de salle décidé par
 * la scolarité fait ainsi basculer les volets sans recharger la page.
 *
 * @param {() => void} refresh - rechargement silencieux (sans squelette de chargement)
 * @param {number} intervalMs - période de rafraîchissement
 */
export default function useLiveRefresh(refresh, intervalMs = 60000) {
  const latest = useRef(refresh);
  latest.current = refresh;

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') latest.current();
    };
    const id = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [intervalMs]);
}
