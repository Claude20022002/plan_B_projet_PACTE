import { useCallback, useEffect, useState } from 'react';
import { espaceCoursAPI } from '../services/espaceCours';

/**
 * Sondages d'une classe (lot EC-9) : ceux que l'enseignant gère, ou ceux qui attendent la réponse
 * de l'étudiant. Interrupteur de l'école éteint, ou lecture en échec : `actif` est faux et la page
 * ne montre rien des sondages (le reste de l'espace de cours ne dépend pas d'eux).
 */
export default function useSondages(idCours, idGroupe) {
  const [donnees, setDonnees] = useState(null);

  const charger = useCallback(
    () => espaceCoursAPI.sondages(idCours, idGroupe).then(setDonnees, () => setDonnees(null)),
    [idCours, idGroupe]
  );

  useEffect(() => {
    charger();
  }, [charger]);

  return { actif: Boolean(donnees?.actif), sondages: donnees?.sondages ?? [], charger };
}
