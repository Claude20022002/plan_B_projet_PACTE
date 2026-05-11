/**
 * useConflits.js
 * Conflits avec polling des non-résolus (badge dashboard).
 */

import {
  useQuery, useMutation, useQueryClient, keepPreviousData,
} from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { getUserMessage } from '../../services/errors';
import { conflitsAPI } from '../../services/domains/conflits.api';
import { QK } from './_shared/queryKeys';

export function useConflitsList(params) {
  const result = useQuery({
    queryKey:        QK.conflits.list(params),
    queryFn:         () => conflitsAPI.getAll(params),
    placeholderData: keepPreviousData,
    select: (res) => ({
      items:      res.data       ?? [],
      total:      res.pagination?.total ?? 0,
    }),
  });

  return {
    items:     result.data?.items ?? [],
    total:     result.data?.total ?? 0,
    isLoading: result.isLoading,
    isFetching:result.isFetching,
    error:     result.error,
  };
}

/**
 * Conflits non résolus — utilisé par le dashboard pour le badge rouge.
 * Polling toutes les 60s (pas de WebSocket en place).
 * staleTime court pour des données urgentes.
 */
export function useConflitsNonResolus() {
  return useQuery({
    queryKey:        QK.conflits.nonResolus(),
    queryFn:         () => conflitsAPI.getNonResolus({ limit: 100 }),
    staleTime:       15_000,
    refetchInterval: 60_000,
    select: (res) => ({
      items: res.data ?? [],
      count: (res.data ?? []).length,
    }),
  });
}

/**
 * Résoudre un conflit — met à jour le statut via PATCH.
 * Invalide les non-résolus ET la liste globale.
 */
export function useResoudreConflit() {
  const qc    = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id) =>
      conflitsAPI.update(id, {
        resolu:           true,
        date_resolution:  new Date().toISOString(),
      }),

    // Optimistic : retire le conflit des non-résolus immédiatement
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: QK.conflits.nonResolus() });
      const prev = qc.getQueryData(QK.conflits.nonResolus());

      qc.setQueryData(QK.conflits.nonResolus(), (old) => {
        if (!old?.items) return old;
        return { ...old, items: old.items.filter((c) => c.id_conflit !== id) };
      });

      return { prev };
    },

    onError: (error, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.conflits.nonResolus(), ctx.prev);
      toast.error(getUserMessage(error));
    },

    onSuccess: () => toast.success('Conflit marqué comme résolu'),
    onSettled: () => qc.invalidateQueries({ queryKey: QK.conflits.all() }),
  });
}
