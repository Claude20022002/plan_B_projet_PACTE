/**
 * useGlobalQueryError.js
 * Intercepte TOUTES les erreurs React Query et les pousse dans le Toast.
 *
 * Monté une seule fois dans AppProviders → <QueryErrorBridge />.
 * Les pages n'ont pas besoin de gérer les erreurs réseaux elles-mêmes
 * sauf si elles veulent un comportement spécifique (formulaire, inline, etc.).
 *
 * Stratégie de filtrage :
 *   - Erreurs de connexion → toast "Connexion perdue"
 *   - 401 → silencieux (AuthContext gère la redirection)
 *   - 403 → toast "Accès refusé"
 *   - 404 → silencieux par défaut (composant affiche EmptyState)
 *   - 422 / 400 → silencieux (formulaire affiche les erreurs inline)
 *   - 5xx → toast "Erreur serveur"
 *   - Les mutations sont exclues (gérées localement dans chaque hook)
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../../contexts/ToastContext';
import { isAppError, ERROR_CODES, getUserMessage } from '../../../services/errors';

export function useGlobalQueryError() {
  const qc   = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    // Abonnement aux événements du cache React Query
    const unsubscribe = qc.getQueryCache().subscribe((event) => {
      // Ne traiter que les erreurs des QUERIES (pas des mutations)
      if (event.type !== 'updated') return;
      if (event.query.state.status !== 'error') return;

      const error = event.query.state.error;
      if (!error) return;

      // Filtrer les erreurs qui ne méritent pas un toast global
      if (isAppError(error)) {
        const silent = [
          ERROR_CODES.CANCELLED,       // Annulation intentionnelle
          ERROR_CODES.UNAUTHORIZED,    // AuthContext gère la redirection
          ERROR_CODES.NOT_FOUND,       // Composant affiche EmptyState
          ERROR_CODES.VALIDATION,      // Formulaire affiche erreurs inline
        ];
        if (silent.includes(error.code)) return;

        // 400 (bad request) → silencieux pour les queries
        if (error.status === 400) return;
      }

      // Afficher le toast avec le message lisible
      const message = getUserMessage(error);
      const severity = isAppError(error) && error.isConnectionError
        ? 'warning'
        : 'error';

      toast.show(message, severity, 6000);
    });

    return unsubscribe;
  }, [qc, toast]);
}
