import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { calendrierAPI, filiereAPI, generationAutomatiqueAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { fetchAll } from '../../utils/fetchAll';
import { aujourdhui } from '../../../../shared/dates.js';

/**
 * Génération automatique : les périodes et filières à choisir, puis la génération en cours ou la
 * dernière terminée, suivie toutes les deux secondes tant qu'elle tourne.
 * Rend { chargement, periodes, filieres, idPeriode, setIdPeriode, choisies, setChoisies, session,
 * envoi, lancer(), arreter() }. La durée du calcul n'est plus demandée : le serveur la choisit
 * d'après la taille du problème (R-4).
 */
export default function useSuiviGeneration() {
    const { t } = useTranslation();
    const toast = useToast();
    const [periodes, setPeriodes] = useState([]);
    const [idPeriode, setIdPeriode] = useState('');
    const [filieres, setFilieres] = useState([]);
    const [choisies, setChoisies] = useState([]);
    const [session, setSession] = useState(null);
    const [chargement, setChargement] = useState(true);
    const [envoi, setEnvoi] = useState(false);
    const minuterie = useRef(null);

    const suivre = useCallback(
        (id) => {
            clearTimeout(minuterie.current);
            const tour = async () => {
                try {
                    const s = await generationAutomatiqueAPI.session(id);
                    setSession(s);
                    if (s.status === 'running') minuterie.current = setTimeout(tour, 2000);
                    // Le message du serveur répète le résumé affiché dessous : un mot qui y mène suffit
                    else if (s.status === 'completed') toast.success(t('gen.done'));
                    else toast.error(s.last_message);
                } catch {
                    minuterie.current = setTimeout(tour, 5000);
                }
            };
            tour();
        },
        [t, toast]
    );

    useEffect(() => {
        Promise.all([calendrierAPI.getAnnees(), fetchAll(filiereAPI.getAll), generationAutomatiqueAPI.sessions()])
            .then(([annees, toutes, sessions]) => {
                const liste = annees.flatMap((a) => a.periodes.map((p) => ({ ...p, libelle_annee: a.libelle, active: a.active })));
                setPeriodes(liste);
                setFilieres(toutes);
                const today = aujourdhui();
                const courante = liste.find((p) => p.active && p.date_fin >= today) || liste.find((p) => p.active) || liste[0];
                setIdPeriode(courante?.id_periode ?? '');
                // Reprendre le suivi d'une génération en cours, sinon afficher le dernier rapport
                const derniere = sessions.find((s) => s.config?.moteur === 'timefold');
                if (derniere?.status === 'running') suivre(derniere.id_generation_session);
                else setSession(derniere ?? null);
            })
            .catch(() => toast.error(t('common.errorLoad')))
            .finally(() => setChargement(false));
        return () => clearTimeout(minuterie.current);
    }, [t, toast, suivre]);

    const lancer = async () => {
        setEnvoi(true);
        try {
            const { session: s } = await generationAutomatiqueAPI.generer({ id_periode: idPeriode, id_filieres: choisies });
            setSession(s);
            suivre(s.id_generation_session);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setEnvoi(false);
        }
    };

    const arreter = async () => {
        try {
            const { message } = await generationAutomatiqueAPI.arreter(session.id_generation_session);
            toast.info(message);
        } catch (error) {
            toast.error(error.message);
        }
    };

    return { chargement, periodes, filieres, idPeriode, setIdPeriode, choisies, setChoisies, session, envoi, lancer, arreter };
}
