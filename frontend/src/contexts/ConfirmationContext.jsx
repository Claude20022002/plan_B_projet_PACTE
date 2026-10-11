import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../components/common/ConfirmDialog';

/**
 * Confirmation d'une action, à la place de window.confirm (lot B-5) : la fenêtre commune
 * (ConfirmDialog), rendue une seule fois par l'application. Usage, sur le modèle de useToast :
 *   const confirmer = useConfirmation();
 *   if (!(await confirmer('Supprimer cet étudiant ?'))) return;
 * confirmer accepte aussi { titre, message, libelle } ; il rend une promesse : true si l'utilisateur
 * confirme, false s'il annule ou ferme la fenêtre.
 */
const ConfirmationContext = createContext(null);

export function ConfirmationProvider({ children }) {
  const { t } = useTranslation();
  const [demande, setDemande] = useState(null); // { titre, message, libelle }
  const reponse = useRef(null);

  const confirmer = useCallback((options) => {
    // Une demande encore ouverte est refusée : une seule fenêtre à la fois
    reponse.current?.(false);
    setDemande(typeof options === 'string' ? { message: options } : options);
    return new Promise((resolve) => {
      reponse.current = resolve;
    });
  }, []);

  const repondre = (oui) => {
    reponse.current?.(oui);
    reponse.current = null;
    setDemande(null);
  };

  return (
    <ConfirmationContext.Provider value={confirmer}>
      {children}
      <ConfirmDialog
        open={Boolean(demande)}
        title={demande?.titre ?? t('common.confirmTitle')}
        message={demande?.message ?? ''}
        confirmLabel={demande?.libelle ?? t('common.delete')}
        onConfirm={() => repondre(true)}
        onCancel={() => repondre(false)}
      />
    </ConfirmationContext.Provider>
  );
}

/** Rend confirmer(options) : une promesse, true si l'utilisateur confirme. */
export function useConfirmation() {
  const confirmer = useContext(ConfirmationContext);
  if (!confirmer) throw new Error('useConfirmation doit être utilisé sous ConfirmationProvider');
  return confirmer;
}
