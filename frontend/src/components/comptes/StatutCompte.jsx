import React from 'react';
import { Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { localeEcran } from '../../utils/dates';

/**
 * Statut d'un compte (lot ME-17) : actif, désactivation programmée (avec sa date), désactivé ou
 * anonymisé. Un compte à désactivation programmée reste actif jusqu'à sa date.
 */
export default function StatutCompte({ compte }) {
    const { t, i18n } = useTranslation();
    if (compte.anonymise_le) return <Chip size="small" label={t('comptes.statut.anonymise')} />;
    if (!compte.actif) return <Chip size="small" label={t('comptes.statut.desactive')} />;
    if (compte.desactivation_prevue_le) {
        const date = new Date(`${compte.desactivation_prevue_le}T00:00:00`).toLocaleDateString(localeEcran(i18n.language), { dateStyle: 'medium' });
        return <Chip size="small" color="warning" label={t('comptes.statut.programme', { date })} />;
    }
    return <Chip size="small" color="success" label={t('utilisateurs.actif')} />;
}
