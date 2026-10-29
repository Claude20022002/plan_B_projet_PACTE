import { useCallback, useMemo, useState } from 'react';
import useAnnees from './useAnnees';
import { filtreAnnee, valeurRetenue } from '../utils/annees';

// Le choix suit l'administrateur d'une page de gestion à l'autre, le temps de la session ; une
// nouvelle session repart de l'année en cours (fichier 11 : « filtré sur l'année en cours par défaut »)
const CLE = 'planner.anneeChoisie';

const lire = () => {
    try {
        return sessionStorage.getItem(CLE);
    } catch {
        return null;
    }
};

const ecrire = (valeur) => {
    try {
        sessionStorage.setItem(CLE, valeur);
    } catch {
        // stockage indisponible : le choix vaut pour cette page seulement
    }
};

/**
 * Année des pages de gestion (lot ME-18). `valeur` reste null tant que les années ne sont pas
 * chargées : les pages attendent avant de charger leurs groupes, pour ne pas les charger deux fois.
 * `filtre` se passe tel quel aux listes de groupes (`{ id_annee }`, ou rien pour toutes les années).
 */
export default function useAnneeChoisie() {
    const annees = useAnnees();
    const [choix, setChoix] = useState(lire);

    const valeur = useMemo(() => (annees ? valeurRetenue(annees, choix) : null), [annees, choix]);
    const filtre = useMemo(() => filtreAnnee(valeur), [valeur]);
    const choisir = useCallback((v) => {
        setChoix(v);
        ecrire(v);
    }, []);

    return {
        annees: annees ?? [],
        valeur,
        annee: annees?.find((a) => String(a.id_annee) === valeur) ?? null,
        filtre,
        choisir,
    };
}
