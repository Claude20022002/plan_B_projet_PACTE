import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { generationAutomatiqueAPI, preparationAPI } from '../../services/api';

const parDate = (a, b) => `${a.date_seance}${a.creneau?.heure_debut ?? ''}`.localeCompare(`${b.date_seance}${b.creneau?.heure_debut ?? ''}`);

/**
 * Exploration des emplois du temps après une génération (R-4) : les séances de la version
 * `idSnapshot`, regroupées par classe. Rend { chargement, erreur, classes, chargerEdt }.
 * `classes` : [{ id_groupe, nom_groupe, seances (par date), mois: ['2026-11', …] }], par nom ;
 * `chargerEdt(idGroupe, mois)` : l'emploi du temps du mois au format de l'école, gardé en mémoire.
 */
export default function useExploration(idSnapshot) {
    const [seances, setSeances] = useState(null);
    const [erreur, setErreur] = useState(false);
    const documents = useRef(new Map());

    useEffect(() => {
        let actif = true;
        setSeances(null);
        setErreur(false);
        generationAutomatiqueAPI
            .snapshot(idSnapshot)
            // Une version réactivée puis remplacée garde ses séances annulées : elles ne comptent plus
            .then(({ snapshot }) => actif && setSeances((snapshot.affectations ?? []).filter((s) => s.statut !== 'annule')))
            .catch(() => actif && setErreur(true));
        return () => {
            actif = false;
        };
    }, [idSnapshot]);

    const classes = useMemo(() => {
        const parClasse = new Map();
        for (const s of seances ?? []) {
            const classe = parClasse.get(s.id_groupe) ?? { id_groupe: s.id_groupe, nom_groupe: s.groupe?.nom_groupe ?? String(s.id_groupe), seances: [] };
            classe.seances.push(s);
            parClasse.set(s.id_groupe, classe);
        }
        return [...parClasse.values()]
            .map((c) => {
                const triees = c.seances.sort(parDate);
                return { ...c, seances: triees, mois: [...new Set(triees.map((s) => String(s.date_seance).slice(0, 7)))] };
            })
            .sort((a, b) => a.nom_groupe.localeCompare(b.nom_groupe, 'fr', { numeric: true }));
    }, [seances]);

    const chargerEdt = useCallback(async (idGroupe, mois) => {
        const cle = `${idGroupe}-${mois}`;
        if (!documents.current.has(cle)) documents.current.set(cle, await preparationAPI.edtMensuel(idGroupe, mois));
        return documents.current.get(cle);
    }, []);

    return { chargement: seances === null && !erreur, erreur, classes, chargerEdt };
}
