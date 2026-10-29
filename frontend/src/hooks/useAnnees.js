import { useEffect, useState } from 'react';
import { calendrierAPI } from '../services/api';

/**
 * Années universitaires du calendrier (lot ME-18). null tant qu'elles ne sont pas chargées ; une
 * liste vide si elles ne peuvent pas l'être : les écrans proposent alors tous les groupes.
 * `utile` à faux : rien n'est chargé (un écran qui n'a pas de liste de groupes pour ce rôle).
 */
export default function useAnnees(utile = true) {
    const [annees, setAnnees] = useState(null);

    useEffect(() => {
        if (!utile) return undefined;
        let actif = true;
        calendrierAPI
            .getAnnees()
            .then((liste) => actif && setAnnees(Array.isArray(liste) ? liste : []))
            .catch(() => actif && setAnnees([]));
        return () => {
            actif = false;
        };
    }, [utile]);

    return annees;
}
