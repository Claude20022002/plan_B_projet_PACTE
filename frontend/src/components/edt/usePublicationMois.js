import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { agendaAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

/**
 * Publication d'un mois pour la filière d'une classe (R4, puis publication des changements du
 * 21 octobre 2026). Rend { etat, envoi, publier() } : `etat` vient du serveur ({ publie,
 * dernier_envoi, destinataires, classes_a_republier }), null tant qu'il n'est pas lu ; `envoi`
 * vaut true pendant la publication. `idFiliere` null : rien à lire (pas de classe choisie).
 */
export default function usePublicationMois(mois, idFiliere) {
    const { t } = useTranslation();
    const toast = useToast();
    const [etat, setEtat] = useState(null);
    const [envoi, setEnvoi] = useState(false);

    const lire = useCallback(() => agendaAPI.etatEdt(mois, idFiliere), [mois, idFiliere]);

    useEffect(() => {
        setEtat(null);
        if (!idFiliere || !mois) return undefined;
        let actif = true;
        lire()
            .then((e) => actif && setEtat(e))
            .catch(() => actif && setEtat(null));
        return () => {
            actif = false;
        };
    }, [mois, idFiliere, lire]);

    /** Publie le mois de toute la filière : les classes reçoivent la version actuelle et ses changements. */
    const publier = async () => {
        setEnvoi(true);
        try {
            const bilan = await agendaAPI.publierEdt(mois, idFiliere);
            toast.success(t('monthly.envoi.bilan', { envoye: bilan.envoye, modifie: bilan.modifie, inchange: bilan.inchange }));
            setEtat(await lire());
        } catch (error) {
            toast.error(error.message);
        } finally {
            setEnvoi(false);
        }
    };

    return { etat, envoi, publier };
}
