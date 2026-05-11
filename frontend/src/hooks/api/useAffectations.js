/**
 * useAffectations.js
 * Cas complexe : pagination + filtres multiples + par-enseignant/groupe
 * + confirmer + optimistic update.
 */

import {
  useQuery, useMutation, useQueryClient, keepPreviousData,
} from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { getUserMessage, getFieldErrors } from '../../services/errors';
import { affectationsAPI } from '../../services/domains/affectations.api';
import { QK } from './_shared/queryKeys';

// ── Queries ───────────────────────────────────────────────────────────────

/**
 * @param {{
 *   page?: number, limit?: number,
 *   statut?: string, date_debut?: string, date_fin?: string,
 *   updated_after?: string
 * }} [params]
 */
export function useAffectationsList(params) {
  const result = useQuery({
    queryKey:        QK.affectations.list(params),
    queryFn:         () => affectationsAPI.getAll(params),
    placeholderData: keepPreviousData,
    staleTime:       20_000,
    select: (res) => ({
      items:      res.data       ?? [],
      total:      res.pagination?.total ?? 0,
      pagination: res.pagination ?? {},
    }),
  });

  return {
    items:             result.data?.items ?? [],
    total:             result.data?.total ?? 0,
    isLoading:         result.isLoading,
    isFetching:        result.isFetching,
    isPlaceholderData: result.isPlaceholderData,
    error:             result.error,
  };
}

/** @param {number | null} id */
export function useAffectationDetail(id) {
  return useQuery({
    queryKey: QK.affectations.detail(id),
    queryFn:  () => affectationsAPI.getById(id),
    enabled:  !!id,
    staleTime: 30_000,
    select: (res) => res.data,
  });
}

/**
 * Emploi du temps d'un enseignant.
 * @param {number | null} enseignantId
 * @param {{ date_debut?: string, date_fin?: string, limit?: number }} [params]
 */
export function useAffectationsByEnseignant(enseignantId, params) {
  return useQuery({
    queryKey: QK.affectations.byEnseignant(enseignantId, params),
    queryFn:  () => affectationsAPI.getByEnseignant(enseignantId, params),
    enabled:  !!enseignantId,
    staleTime: 30_000,
    select:   (res) => res.data ?? [],
  });
}

/** @param {number | null} groupeId */
export function useAffectationsByGroupe(groupeId, params) {
  return useQuery({
    queryKey: QK.affectations.byGroupe(groupeId, params),
    queryFn:  () => affectationsAPI.getByGroupe(groupeId, params),
    enabled:  !!groupeId,
    staleTime: 30_000,
    select:   (res) => res.data ?? [],
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────

/** Créer une affectation. Retourne également les erreurs de champ. */
export function useCreateAffectation() {
  const qc    = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: affectationsAPI.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.affectations.all() });
      toast.success('Affectation planifiée avec succès');
    },
    onError: (error) => {
      // Les erreurs de validation (400) sont gérées inline dans le formulaire
      if (error.status !== 400 && error.status !== 422) {
        toast.error(getUserMessage(error));
      }
    },
    // Retourner getFieldErrors() permet au composant formulaire de les afficher
    // dans formik.setErrors(getFieldErrors(err) ?? {})
  });
}

export function useUpdateAffectation(id) {
  const qc    = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (payload) => affectationsAPI.update(id, payload),
    onMutate: async (newData) => {
      await qc.cancelQueries({ queryKey: QK.affectations.detail(id) });
      const prev = qc.getQueryData(QK.affectations.detail(id));
      qc.setQueryData(QK.affectations.detail(id), (old) =>
        old ? { ...old, data: { ...old.data, ...newData } } : old,
      );
      return { prev };
    },
    onError: (error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.affectations.detail(id), ctx.prev);
      toast.error(getUserMessage(error));
    },
    onSuccess: () => toast.success('Affectation modifiée'),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.affectations.all() }),
  });
}

export function useDeleteAffectation() {
  const qc    = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: affectationsAPI.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.affectations.all() });
      toast.success('Affectation supprimée');
    },
    onError: (error) => toast.error(getUserMessage(error)),
  });
}

/**
 * Confirmer une affectation (enseignant ou admin).
 * Optimistic : change le statut de 'planifie' → 'confirme' immédiatement.
 */
export function useConfirmerAffectation() {
  const qc    = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: affectationsAPI.confirmer,

    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.affectations.detail(id) });
      const prev = qc.getQueryData(QK.affectations.detail(id));

      // Mise à jour optimiste du statut
      qc.setQueryData(QK.affectations.detail(id), (old) =>
        old ? { ...old, data: { ...old.data, statut: 'confirme' } } : old,
      );

      // Aussi dans les listes
      qc.setQueriesData({ queryKey: ['affectations', 'list'] }, (old) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((a) =>
            a.id_affectation === id ? { ...a, statut: 'confirme' } : a,
          ),
        };
      });

      return { prev, id };
    },

    onError: (error, id, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.affectations.detail(id), ctx.prev);
      qc.invalidateQueries({ queryKey: QK.affectations.all() });
      toast.error(getUserMessage(error));
    },

    onSuccess: () => toast.success('Affectation confirmée'),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.affectations.all() }),
  });
}
