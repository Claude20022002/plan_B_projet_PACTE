import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../../services/api';
import { localeEcran } from '../../utils/dates';

/**
 * État des actions sur les comptes de la page Utilisateurs (lot ME-17) : sélection de lignes,
 * fenêtres de désactivation (un compte ou la sélection), réactivation et anonymisation.
 * `onSucces(message)` et `onErreur(message)` affichent le retour ; `recharger()` relit la liste.
 */
export default function useActionsComptes({ comptes, recharger, onSucces, onErreur }) {
    const { t, i18n } = useTranslation();
    const [coches, setCoches] = useState(() => new Set());
    const [aDesactiver, setADesactiver] = useState(null);
    const [lot, setLot] = useState(null);
    const [aAnonymiser, setAAnonymiser] = useState(null);

    const nomDe = (c) => `${c.prenom} ${c.nom}`;
    const basculer = (id) => setCoches((avant) => { const suite = new Set(avant); if (!suite.delete(id)) suite.add(id); return suite; });
    const toutBasculer = (ids) => setCoches((avant) => (ids.every((id) => avant.has(id)) ? new Set() : new Set(ids)));
    const vider = () => setCoches(new Set());

    const desactivationFaite = (reponse) => {
        const cible = aDesactiver;
        setADesactiver(null);
        const messages = {
            desactive: t('comptes.desactive', { nom: nomDe(cible) }),
            programmee: t('comptes.programme', { nom: nomDe(cible), date: new Date(`${reponse.effet_le}T00:00:00`).toLocaleDateString(localeEcran(i18n.language), { dateStyle: 'medium' }) }),
            annulee: t('comptes.programmationAnnulee', { nom: nomDe(cible) }),
        };
        onSucces(messages[reponse.statut] ?? messages.desactive);
        recharger();
    };

    const reactiver = async (compte) => {
        try {
            const reponse = await userAPI.reactiver(compte.id_user);
            // Pour un enseignant ou un étudiant, le serveur rappelle de revoir ses services ou ses groupes
            onSucces(t(reponse.a_verifier ? `comptes.reactiveVerifier.${compte.role}` : 'comptes.reactive', { nom: nomDe(compte) }));
            recharger();
        } catch (e) {
            onErreur(e.message);
        }
    };

    const anonymiser = async () => {
        const cible = aAnonymiser;
        setAAnonymiser(null);
        try {
            await userAPI.anonymiser(cible.id_user);
            onSucces(t('comptes.anonymise', { nom: nomDe(cible) }));
            recharger();
        } catch (e) {
            onErreur(e.message);
        }
    };

    // Seuls les comptes de la page affichée et encore actifs peuvent entrer dans un lot
    const selection = comptes.filter((c) => coches.has(c.id_user) && c.actif);

    return {
        coches, selection, basculer, toutBasculer, vider,
        aDesactiver, ouvrirDesactivation: setADesactiver, fermerDesactivation: () => setADesactiver(null), desactivationFaite,
        lot, ouvrirLot: () => setLot(selection), fermerLot: () => setLot(null), lotFini: () => { vider(); recharger(); },
        reactiver, aAnonymiser, demanderAnonymisation: setAAnonymiser, annulerAnonymisation: () => setAAnonymiser(null), anonymiser,
    };
}
