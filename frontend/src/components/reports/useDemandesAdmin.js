import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { demandeReportAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

/**
 * Demandes de report de l'administration : la liste et leur traitement.
 * Rend { demandes, chargement, enCours, violations, fermerViolations, approuver, refuser, approuverSur }.
 * Approuver déplace la séance : une règle enfreinte renvoie 409 et ses règles, gardées dans
 * `violations` ({ liste, demande, forcer(justification) }) pour la fenêtre qui les explique.
 */
export default function useDemandesAdmin() {
    const { t } = useTranslation();
    const toast = useToast();
    const [demandes, setDemandes] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [enCours, setEnCours] = useState(null);
    const [violations, setViolations] = useState(null);

    const charger = useCallback(async () => {
        try {
            const data = await demandeReportAPI.getAll();
            setDemandes(data.data || data || []);
        } catch {
            toast.error(t('reports.erreurChargement'));
        } finally {
            setChargement(false);
        }
    }, [t, toast]);

    useEffect(() => {
        charger();
    }, [charger]);

    /** Envoie la décision ; rend true si elle est enregistrée. */
    const traiter = async (demande, action, extra = {}) => {
        setEnCours(demande.id_demande);
        try {
            await demandeReportAPI.traiter(demande.id_demande, action, extra);
            setViolations(null);
            toast.success(extra.forcer ? t('rules.forced') : t(action === 'approuver' ? 'reportsAdmin.approuvee' : 'reportsAdmin.refusee'));
            await charger();
            return true;
        } catch (error) {
            if (error.status === 409 && error.response?.data?.violations) {
                setViolations({ liste: error.response.data.violations, demande, forcer: (justification) => traiter(demande, action, { forcer: true, justification }) });
            } else {
                toast.error(error.message || t('reportsAdmin.erreurTraitement'));
            }
            return false;
        } finally {
            setEnCours(null);
        }
    };

    /** Approuve sur un autre créneau libre : la demande prend ce créneau, puis elle est approuvée. */
    const approuverSur = async (demande, proposition) => {
        try {
            await demandeReportAPI.update(demande.id_demande, { nouvelle_date: proposition.date, id_creneau_nouveau: proposition.id_creneau });
        } catch (error) {
            toast.error(error.message || t('reportsAdmin.erreurTraitement'));
            return false;
        }
        return traiter(demande, 'approuver');
    };

    return {
        demandes,
        chargement,
        enCours,
        violations,
        fermerViolations: () => setViolations(null),
        approuver: (demande) => traiter(demande, 'approuver'),
        refuser: (demande) => traiter(demande, 'refuser'),
        approuverSur,
    };
}
