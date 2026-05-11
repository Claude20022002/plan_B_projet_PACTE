/**
 * affectations.queries.js
 * React Query hooks pour les affectations.
 *
 * Convention clés :
 *   ['affectations']                          ← invalide TOUT le domaine
 *   ['affectations', 'list', params]          ← liste paginée
 *   ['affectations', 'detail', id]            ← détail
 *   ['affectations', 'enseignant', id, params]← par enseignant
 *   ['affectations', 'groupe', id, params]    ← par groupe
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { affectationsAPI } from '../domains/affectations.api.js';

// ── Clés de cache ─────────────────────────────────────────────────────────
export const AFFECTATIONS_KEYS = {
  all:          () => ['affectations'],
  lists:        () => ['affectations', 'list'],
  list:         (p) => ['affectations', 'list', p ?? {}],
  detail:       (id) => ['affectations', 'detail', id],
  byEnseignant: (id, p) => ['affectations', 'enseignant', id, p ?? {}],
  byGroupe:     (id, p) => ['affectations', 'groupe', id, p ?? {}],
};

// ── Queries ───────────────────────────────────────────────────────────────
/**
 * Liste paginée avec pagination côté serveur.
 * `keepPreviousData` pour éviter le flash pendant les changements de page.
 *
 * @param {{ page?: number, limit?: number, statut?: string, date_debut?: string, date_fin?: string }} [params]
 * @param {{ enabled?: boolean }} [options]
 */
export function useAffectations(params, options = {}) {
  return useQuery({
    queryKey: AFFECTATIONS_KEYS.list(params),
    queryFn:  () => affectationsAPI.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 20_000,
    select: (res) => ({
      items:      res.data       || [],
      pagination: res.pagination || { total: 0, page: 1, limit: 10 },
    }),
    ...options,
  });
}

/**
 * Détail d'une affectation.
 * @param {number|null} id
 */
export function useAffectation(id) {
  return useQuery({
    queryKey: AFFECTATIONS_KEYS.detail(id),
    queryFn:  () => affectationsAPI.getById(id),
    enabled:  !!id,
    select:   (res) => res.data,
  });
}

/**
 * Affectations d'un enseignant.
 * @param {number|null} enseignantId
 * @param {{ date_debut?: string, date_fin?: string, limit?: number }} [params]
 */
export function useAffectationsByEnseignant(enseignantId, params) {
  return useQuery({
    queryKey: AFFECTATIONS_KEYS.byEnseignant(enseignantId, params),
    queryFn:  () => affectationsAPI.getByEnseignant(enseignantId, params),
    enabled:  !!enseignantId,
    staleTime: 30_000,
    select: (res) => res.data || [],
  });
}

/**
 * Affectations d'un groupe.
 * @param {number|null} groupeId
 * @param {object} [params]
 */
export function useAffectationsByGroupe(groupeId, params) {
  return useQuery({
    queryKey: AFFECTATIONS_KEYS.byGroupe(groupeId, params),
    queryFn:  () => affectationsAPI.getByGroupe(groupeId, params),
    enabled:  !!groupeId,
    select:   (res) => res.data || [],
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────
/**
 * Créer une affectation.
 * Invalide toutes les listes après succès.
 *
 * @example
 * const { mutate: create, isPending } = useCreateAffectation();
 * create(payload, { onSuccess: () => toast.success('Affectation créée') });
 */
export function useCreateAffectation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: affectationsAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AFFECTATIONS_KEYS.all() });
    },
  });
}

/**
 * Modifier une affectation.
 * Mise à jour optimiste du détail + invalidation de la liste.
 *
 * @param {number} id
 */
export function useUpdateAffectation(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => affectationsAPI.update(id, payload),
    // Mise à jour optimiste
    onMutate: async (newData) => {
      await qc.cancelQueries({ queryKey: AFFECTATIONS_KEYS.detail(id) });
      const prev = qc.getQueryData(AFFECTATIONS_KEYS.detail(id));
      qc.setQueryData(AFFECTATIONS_KEYS.detail(id), (old) =>
        old ? { ...old, data: { ...old.data, ...newData } } : old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      // Rollback en cas d'erreur
      if (ctx?.prev) qc.setQueryData(AFFECTATIONS_KEYS.detail(id), ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: AFFECTATIONS_KEYS.all() });
    },
  });
}

/**
 * Supprimer une affectation.
 */
export function useDeleteAffectation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: affectationsAPI.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AFFECTATIONS_KEYS.all() });
    },
  });
}

/**
 * Confirmer une affectation (enseignant ou admin).
 * @param {number} id
 */
export function useConfirmerAffectation(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => affectationsAPI.confirmer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: AFFECTATIONS_KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: AFFECTATIONS_KEYS.lists() });
    },
  });
}
