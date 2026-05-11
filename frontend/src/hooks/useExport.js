/**
 * useExport.js
 * Hook utilitaire pour les boutons d'export avec état de chargement.
 *
 * @param {() => Promise<void>} exportFn
 */

import { useState, useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';
import { getUserMessage } from '../services/errors';

export function useExport(exportFn) {
  const [isPending, setIsPending] = useState(false);
  const toast = useToast();

  const run = useCallback(async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      await exportFn();
    } catch (error) {
      toast.error(getUserMessage(error) || 'Erreur lors de l\'export');
    } finally {
      setIsPending(false);
    }
  }, [exportFn, isPending, toast]);

  return { run, isPending };
}
