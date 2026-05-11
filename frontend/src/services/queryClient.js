/**
 * queryClient.js
 * Configuration globale de React Query.
 * Un seul QueryClient partagé dans toute l'application.
 */

import { QueryClient } from '@tanstack/react-query';
import { isAppError, ERROR_CODES } from './errors.js';

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Détermine si une erreur mérite un retry automatique.
 * @param {number} failureCount
 * @param {unknown} error
 * @returns {boolean}
 */
function shouldRetry(failureCount, error) {
  if (failureCount >= 2) return false;
  if (!isAppError(error)) return failureCount < 1;
  // Ne jamais retenter les erreurs métier
  const noRetry = [
    ERROR_CODES.UNAUTHORIZED,
    ERROR_CODES.FORBIDDEN,
    ERROR_CODES.NOT_FOUND,
    ERROR_CODES.VALIDATION,
    ERROR_CODES.CONFLICT,
    ERROR_CODES.CANCELLED,
  ];
  if (noRetry.includes(error.code)) return false;
  // Retenter les erreurs réseau et serveur 5xx
  return error.isRetryable;
}

/**
 * Délai entre les retries (exponentiel).
 * @param {number} attempt
 * @returns {number} ms
 */
function retryDelay(attempt) {
  return Math.min(1_000 * Math.pow(2, attempt), 10_000);
}

// ── Création du QueryClient ───────────────────────────────────────────────
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Données considérées "fraîches" pendant 30s.
       * Après : refetch automatique en arrière-plan au prochain focus/mount.
       */
      staleTime: 30_000,

      /**
       * Données gardées en cache 5 min après que le composant se démonte.
       * Évite les refetch inutiles sur navigation back/forward.
       */
      gcTime: 5 * 60_000,

      /** Retry intelligent (pas sur les erreurs 4xx métier) */
      retry: shouldRetry,
      retryDelay,

      /**
       * Pas de refetch automatique quand la fenêtre reprend le focus.
       * Évite les requêtes surprises en milieu de saisie.
       * Activer en production si temps réel souhaité.
       */
      refetchOnWindowFocus: false,

      /** Refetch quand l'utilisateur se reconnecte à internet */
      refetchOnReconnect: true,

      /** Pas de refetch si le composant est remonté (ex: navigation) */
      refetchOnMount: true,
    },
    mutations: {
      /** Retry 0 par défaut sur les mutations (actions intentionnelles) */
      retry: 0,
    },
  },
});

// ── Helpers de cache ──────────────────────────────────────────────────────

/**
 * Invalide toutes les queries d'un domaine.
 * @param {string} domain - ex: 'affectations', 'conflits'
 */
export function invalidateDomain(domain) {
  return queryClient.invalidateQueries({ queryKey: [domain] });
}

/**
 * Invalide plusieurs domaines en une fois.
 * @param {string[]} domains
 */
export function invalidateDomains(...domains) {
  return Promise.all(domains.map(invalidateDomain));
}

/**
 * Pré-charge des données dans le cache (ex: au hover d'un lien).
 * @param {string[]} queryKey
 * @param {() => Promise<unknown>} fn
 */
export function prefetchQuery(queryKey, fn) {
  return queryClient.prefetchQuery({ queryKey, queryFn: fn, staleTime: 60_000 });
}

export default queryClient;
