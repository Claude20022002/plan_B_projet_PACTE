import React, { useState } from 'react';
import { IconButton } from '@mui/material';
import { Block, Undo } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { userAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import ConfirmDialog from '../common/ConfirmDialog';
import DesactivationLotDialog from './DesactivationLotDialog';

/**
 * Boutons « désactiver les comptes de ce groupe » (lot ME-17, « désactiver la promotion ») et
 * « rétablir les comptes de ce groupe » (réactive ceux désactivés, annule les désactivations
 * programmées). Réservés à l'administration : les routes du serveur le sont aussi. Les enseignants
 * ne sont pas concernés, seulement les étudiants inscrits dans le groupe et ses sous-groupes.
 */
export default function DesactiverGroupe({ groupe }) {
    const { t } = useTranslation();
    const toast = useToast();
    const [ouvert, setOuvert] = useState(false);
    const [retablir, setRetablir] = useState(false);

    const retablirLeGroupe = async () => {
        setRetablir(false);
        try {
            const r = await userAPI.retablirEnLot({ id_groupe: groupe.id_groupe });
            toast.success(t('comptes.defait', { reactives: r.reactives, annulees: r.programmations_annulees }));
        } catch (e) {
            toast.error(e.message);
        }
    };

    return (
        <>
            <IconButton size="small" onClick={() => setOuvert(true)} aria-label={t('comptes.desactiverGroupeNom', { nom: groupe.nom_groupe })} title={t('comptes.desactiverGroupe')}>
                <Block fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => setRetablir(true)} aria-label={t('comptes.retablirGroupeNom', { nom: groupe.nom_groupe })} title={t('comptes.retablirGroupe')}>
                <Undo fontSize="small" />
            </IconButton>
            <DesactivationLotDialog groupe={ouvert ? groupe : null} onClose={() => setOuvert(false)} />
            <ConfirmDialog
                open={retablir}
                title={t('comptes.retablirGroupe')}
                message={t('comptes.retablirMessage', { nom: groupe.nom_groupe })}
                confirmLabel={t('comptes.retablir')}
                confirmColor="primary"
                onConfirm={retablirLeGroupe}
                onCancel={() => setRetablir(false)}
            />
        </>
    );
}
