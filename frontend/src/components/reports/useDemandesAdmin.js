import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { demandeReportAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

/**
 * Demandes de report de l'administration : la liste et leur traitement.
 * Rend { demandes, chargement, enCours, violations, fermerViolations, approuver, refuser(demande, raison),
 * approuverSur, plusTard, fixerDate(demande, proposition) }.
 * Approuver (ou fixer la date d'une séance à reprogrammer) vérifie les règles : une règle enfreinte
 * renvoie 409 et ses règles, gardées dans `violations` ({ liste, demande, forcer(justification) })
 * pour la fenêtre qui les explique.
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

    /**
     * Envoie une décision : `appel(extra)` fait la requête, `extra` porte un forçage justifié.
     * Rend true si elle est enregistrée.
     */
    const decider = async (demande, appel, succes, extra = {}) => {
        setEnCours(demande.id_demande);
        try {
            await appel(extra);
            setViolations(null);
            toast.success(extra.forcer ? t('rules.forced') : succes);
            await charger();
            return true;
        } catch (error) {
            if (error.status === 409 && error.response?.data?.violations) {
                setViolations({ liste: error.response.data.violations, demande, forcer: (justification) => decider(demande, appel, succes, { forcer: true, justification }) });
            } else if (error.response?.data?.code === 'AUCUN_CRENEAU_LIBRE') {
                toast.error(t('reports.plusLibre'));
            } else {
                toast.error(error.message || t('reportsAdmin.erreurTraitement'));
            }
            return false;
        } finally {
            setEnCours(null);
        }
    };

    const approuver = (demande) => decider(demande, (extra) => demandeReportAPI.traiter(demande.id_demande, 'approuver', extra), t('reportsAdmin.approuvee'));

    /** Approuve sur un autre créneau libre : la demande prend ce créneau, puis elle est approuvée. */
    const approuverSur = async (demande, proposition) => {
        try {
            await demandeReportAPI.update(demande.id_demande, { nouvelle_date: proposition.date, id_creneau_nouveau: proposition.id_creneau });
        } catch (error) {
            toast.error(error.message || t('reportsAdmin.erreurTraitement'));
            return false;
        }
        return approuver(demande);
    };

    return {
        demandes,
        chargement,
        enCours,
        violations,
        fermerViolations: () => setViolations(null),
        approuver,
        // La raison est facultative : sans elle, la notification de l'enseignant n'en cite pas
        refuser: (demande, raison = '') => decider(demande, () => demandeReportAPI.traiter(demande.id_demande, 'refuser', raison ? { motif: raison } : {}), t('reportsAdmin.refusee')),
        approuverSur,
        // R-1 : accepté sans date, la séance quitte l'emploi du temps et attend sa nouvelle date
        plusTard: (demande) => decider(demande, () => demandeReportAPI.plusTard(demande.id_demande), t('reportsAdmin.plusTardFait')),
        // La place choisie dans l'assistant (salle comprise) ; l'enseignant la confirme ensuite
        fixerDate: (demande, proposition) =>
            decider(
                demande,
                (extra) => demandeReportAPI.reprogrammer(demande.id_demande, { date: proposition.date, id_creneau: proposition.id_creneau, id_salle: proposition.id_salle ?? null, ...extra }),
                t('reportsAdmin.dateFixee'),
            ),
    };
}
