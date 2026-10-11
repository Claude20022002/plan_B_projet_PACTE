import { useCallback, useEffect, useState } from 'react';

/**
 * Réglages communs aux écrans projetés en classe (appel, quiz en direct) : l'écran ne se met pas
 * en veille tant que la page est ouverte (si le navigateur le permet), et le plein écran se bascule
 * d'un geste. Rend { pleinEcran, basculerPleinEcran }.
 */
export default function useEcranProjete() {
  const [pleinEcran, setPleinEcran] = useState(false);

  useEffect(() => {
    const suivre = () => setPleinEcran(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', suivre);
    return () => document.removeEventListener('fullscreenchange', suivre);
  }, []);

  useEffect(() => {
    let verrou = null;
    const demander = async () => {
      try {
        verrou = (await navigator.wakeLock?.request('screen')) ?? null;
      } catch {
        // Refusé ou non pris en charge : l'écran suit ses réglages de veille
      }
    };
    demander();
    // Le verrou tombe quand l'onglet est caché : il est redemandé au retour
    const reprendre = () => document.visibilityState === 'visible' && demander();
    document.addEventListener('visibilitychange', reprendre);
    return () => {
      document.removeEventListener('visibilitychange', reprendre);
      verrou?.release().catch(() => {});
    };
  }, []);

  const basculerPleinEcran = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  return { pleinEcran, basculerPleinEcran };
}
