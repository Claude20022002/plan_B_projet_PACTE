import { useEffect, useState } from 'react';
import { creneauAPI } from '../services/api';

/**
 * Créneaux de la grille, rangés par identifiant (Map id_creneau → créneau) : pour afficher l'heure
 * d'un créneau dont on n'a que l'identifiant (créneau visé d'un report, créneau d'origine).
 * Une Map vide tant que la grille n'est pas chargée, ou si elle ne peut pas l'être : les écrans
 * affichent alors la date seule.
 */
export default function useCreneauxParId() {
    const [creneaux, setCreneaux] = useState(() => new Map());

    useEffect(() => {
        let actif = true;
        creneauAPI
            .getTous()
            .then((liste) => actif && setCreneaux(new Map(liste.map((c) => [c.id_creneau, c]))))
            .catch(() => {});
        return () => {
            actif = false;
        };
    }, []);

    return creneaux;
}
