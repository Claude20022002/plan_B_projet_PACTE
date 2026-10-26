import React from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../common/ConfirmDialog';
import DesactiverDialog from './DesactiverDialog';
import DesactivationLotDialog from './DesactivationLotDialog';

/** Les fenêtres des actions sur les comptes (lot ME-17), pilotées par useActionsComptes. */
export default function DialoguesComptes({ actions }) {
    const { t } = useTranslation();
    const cible = actions.aAnonymiser;
    return (
        <>
            <DesactiverDialog compte={actions.aDesactiver} onClose={actions.fermerDesactivation} onFait={actions.desactivationFaite} />
            <DesactivationLotDialog comptes={actions.lot} onClose={actions.fermerLot} onFini={actions.lotFini} />
            <ConfirmDialog
                open={Boolean(cible)}
                title={t('comptes.anonymiserTitre')}
                message={t('comptes.anonymiserMessage', { nom: `${cible?.prenom ?? ''} ${cible?.nom ?? ''}` })}
                confirmLabel={t('comptes.anonymiser')}
                onConfirm={actions.anonymiser}
                onCancel={actions.annulerAnonymisation}
            />
        </>
    );
}
