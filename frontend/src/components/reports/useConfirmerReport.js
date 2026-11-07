import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { demandeReportAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

/**
 * Réponses de l'enseignant à un report validé par l'administration (décision du 21 octobre).
 * Rend { enCours, accepter(demande), aProposer, avertissement, proposer(demande), fermerProposition,
 * proposee() }. Une place prise entre la validation et la réponse (409 CRENEAU_PLUS_LIBRE) ouvre
 * directement « Proposer un autre créneau ». `recharger()` : relit la liste après une réponse.
 */
export default function useConfirmerReport(recharger) {
    const { t } = useTranslation();
    const toast = useToast();
    const [enCours, setEnCours] = useState(null);
    const [aProposer, setAProposer] = useState(null);
    const [avertissement, setAvertissement] = useState('');

    const proposer = (demande, message = '') => {
        setAvertissement(message);
        setAProposer(demande);
    };

    /** Accepte la place proposée : la séance est déplacée, les étudiants prévenus. */
    const accepter = async (demande) => {
        setEnCours(demande.id_demande);
        try {
            await demandeReportAPI.confirmer(demande.id_demande, { action: 'accepter' });
            toast.success(t('reports.acceptee'));
            await recharger();
        } catch (error) {
            if (error.response?.data?.code === 'CRENEAU_PLUS_LIBRE') proposer(demande, t('reports.plusLibre'));
            else toast.error(error.message || t('reports.erreurConfirmation'));
        } finally {
            setEnCours(null);
        }
    };

    return {
        enCours,
        accepter,
        aProposer,
        avertissement,
        proposer,
        fermerProposition: () => setAProposer(null),
        proposee: async () => {
            setAProposer(null);
            toast.success(t('reports.proposee'));
            await recharger();
        },
    };
}
