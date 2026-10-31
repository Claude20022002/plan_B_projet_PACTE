import React from 'react';
import AnonymiserDialog from './AnonymiserDialog';
import DesactiverDialog from './DesactiverDialog';
import DesactivationLotDialog from './DesactivationLotDialog';

/** Les fenêtres des actions sur les comptes (lot ME-17), pilotées par useActionsComptes. */
export default function DialoguesComptes({ actions }) {
    return (
        <>
            <DesactiverDialog compte={actions.aDesactiver} onClose={actions.fermerDesactivation} onFait={actions.desactivationFaite} />
            <DesactivationLotDialog comptes={actions.lot} onClose={actions.fermerLot} onFini={actions.lotFini} />
            <AnonymiserDialog compte={actions.aAnonymiser} onConfirm={actions.anonymiser} onCancel={actions.annulerAnonymisation} />
        </>
    );
}
