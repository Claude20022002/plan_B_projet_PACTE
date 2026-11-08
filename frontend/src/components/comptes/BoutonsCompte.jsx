import React from 'react';
import { IconButton } from '@mui/material';
import { Block, HowToReg, PersonOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

/**
 * Boutons d'un compte dans la liste (lot ME-17) : désactiver (ou modifier la programmation) pour
 * un compte actif, réactiver et anonymiser pour un compte désactivé. Rien pour son propre compte :
 * le serveur le refuse de toute façon (SOI_MEME).
 */
export default function BoutonsCompte({ compte, actions, estMoi }) {
    const { t } = useTranslation();
    if (estMoi || compte.anonymise_le) return null;
    const nom = `${compte.prenom} ${compte.nom}`;
    if (compte.actif) {
        return (
            <IconButton size="small" onClick={() => actions.ouvrirDesactivation(compte)} aria-label={t('comptes.desactiverNom', { nom })} title={t('comptes.desactiver')}>
                <Block />
            </IconButton>
        );
    }
    return (
        <>
            <IconButton size="small" onClick={() => actions.reactiver(compte)} aria-label={t('comptes.reactiverNom', { nom })} title={t('comptes.reactiver')}>
                <HowToReg />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => actions.demanderAnonymisation(compte)} aria-label={t('comptes.anonymiserNom', { nom })} title={t('comptes.anonymiser')}>
                <PersonOff />
            </IconButton>
        </>
    );
}
