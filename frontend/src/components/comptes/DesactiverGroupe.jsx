import React, { useState } from 'react';
import { IconButton } from '@mui/material';
import { Block } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import DesactivationLotDialog from './DesactivationLotDialog';

/**
 * Bouton « désactiver les comptes de ce groupe » (lot ME-17, « désactiver la promotion »), avec sa
 * fenêtre. Réservé à l'administration : la route du serveur l'est aussi. Les enseignants ne sont
 * pas concernés, seulement les étudiants inscrits dans le groupe et ses sous-groupes.
 */
export default function DesactiverGroupe({ groupe }) {
    const { t } = useTranslation();
    const [ouvert, setOuvert] = useState(false);
    return (
        <>
            <IconButton size="small" onClick={() => setOuvert(true)} aria-label={t('comptes.desactiverGroupeNom', { nom: groupe.nom_groupe })} title={t('comptes.desactiverGroupe')}>
                <Block fontSize="small" />
            </IconButton>
            <DesactivationLotDialog groupe={ouvert ? groupe : null} onClose={() => setOuvert(false)} />
        </>
    );
}
