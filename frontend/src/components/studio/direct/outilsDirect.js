import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Outils communs aux deux écrans du quiz en direct (enseignant et étudiant) : relire l'état du
 * serveur chaque seconde, et compter le temps restant d'après l'heure du serveur (le téléphone
 * peut avancer ou retarder : seul compte le chrono du serveur, qui ferme la question).
 */

/** Intervalle de relecture : une seconde, comme le prévoit le plan (lot SC-1). */
export const RELECTURE_MS = 1000;

/**
 * Appelle `lire` tout de suite, puis toutes les secondes tant que l'onglet est visible.
 * @param {() => Promise<void>} lire
 * @param {boolean} actif faux pour arrêter (quiz terminé)
 */
export const useRelecture = (lire, actif = true) => {
  const enCours = useRef(false);
  const tour = useCallback(async () => {
    // Une lecture lente ne s'empile pas sur la suivante
    if (enCours.current) return;
    enCours.current = true;
    try {
      await lire();
    } finally {
      enCours.current = false;
    }
  }, [lire]);
  useEffect(() => {
    if (!actif) return undefined;
    tour();
    const minuterie = setInterval(() => document.visibilityState === 'visible' && tour(), RELECTURE_MS);
    return () => clearInterval(minuterie);
  }, [tour, actif]);
};

/**
 * Secondes restantes de la question ouverte, ou null hors question.
 * @param {{ etape: string, debut_ms: number|null, duree_s: number }|null} vue
 * @param {number|null} heureServeur dernière heure lue au serveur (maintenant_ms)
 */
export const useRestant = (vue, heureServeur) => {
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const decalage = useRef(0);
  useEffect(() => {
    if (heureServeur) decalage.current = heureServeur - Date.now();
  }, [heureServeur]);
  const enQuestion = vue?.etape === 'question' && vue.debut_ms !== null && vue.debut_ms !== undefined;
  useEffect(() => {
    if (!enQuestion) return undefined;
    const minuterie = setInterval(() => setMaintenant(Date.now()), 250);
    return () => clearInterval(minuterie);
  }, [enQuestion]);
  if (!enQuestion) return null;
  return Math.max(0, Math.ceil((vue.debut_ms + vue.duree_s * 1000 - (maintenant + decalage.current)) / 1000));
};

/** Question projetée ou à laquelle répondre, au format des composants de réponse du Studio. */
export const correctionDe = (bonneReponse, statut) => (bonneReponse === undefined ? null : { bonne_reponse: bonneReponse, statut });
