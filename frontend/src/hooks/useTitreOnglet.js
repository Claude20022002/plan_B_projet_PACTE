import { useEffect } from 'react';

const NOM = 'HESTIM Planner';

/**
 * Titre de l'onglet du navigateur (WCAG 2.4.2, recette du 20 octobre, M-13) : « Titre · HESTIM Planner »,
 * ou le nom seul sans titre. Chaque écran l'appelle avec son titre, déjà traduit : sans cela, le titre
 * de la page précédente resterait affiché, l'application ne rechargeant jamais la page.
 */
export default function useTitreOnglet(titre) {
  useEffect(() => {
    document.title = titre && titre !== NOM ? `${titre} · ${NOM}` : NOM;
  }, [titre]);
}
