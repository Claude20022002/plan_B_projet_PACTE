/**
 * conflits.queries.js
 * React Query hooks pour les conflits de planning.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conflitsAPI } from '../domains/conflits.api.js';

export const CONFLITS_KEYS = {
  all:        () => ['conflits'],
  list:       (p) => ['conflits', 'list', p ?? {}],
  nonResolus: (p) => ['conflits', 'non-resolus', p ?? {}],
  detail:     (id) => ['conflits', 'detail', id],
};

/**
 * Liste de tous les conflits.
 * @param {{ page?: number, limit?: number, resolu?: boolean }} [params]
 */
export function useConflits(params) {
  return useQuery({
    queryKey: CONFLITS_KEYS.list(params),
    queryFn:  () => conflitsAPI.getAll(params),
    select:   (res) => ({
      items:      res.data || [],
      pagination: res.pagination || {},
    }),
  });
}

/**
 * Conflits non résolus uniquement.
 * Utilisé par le dashboard admin pour le badge d'alerte.
 * staleTime court : ces données doivent être fraîches.
 */
export function useConflitsNonResolus(params) {
  return useQuery({
    queryKey: CONFLITS_KEYS.nonResolus(params),
    queryFn:  () => conflitsAPI.getNonResolus(params),
    staleTime: 15_000, // Rafraîchit plus souvent (données urgentes)
    select:   (res) => res.data || [],
  });
}

/**
 * Marquer un conflit comme résolu.
 * Invalide toute la liste des conflits + les non-résolus.
 */
export function useResoudreConflit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) =>
      conflitsAPI.update(id, {
        resolu: true,
        date_resolution: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONFLITS_KEYS.all() });
    },
  });
}

/**
 * Créer un conflit manuellement.
 */
export function useCreateConflit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: conflitsAPI.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: CONFLITS_KEYS.all() }),
  });
}
