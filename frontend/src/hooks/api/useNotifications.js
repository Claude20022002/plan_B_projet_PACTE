/**
 * useNotifications.js
 * Notifications avec polling + invalidation sur action.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../contexts/ToastContext';
import { getUserMessage } from '../../services/errors';
import { notificationsAPI } from '../../services/domains/notifications.api';
import { QK } from './_shared/queryKeys';

export function useNotifications(userId) {
  return useQuery({
    queryKey:  QK.notifications.byUser(userId),
    queryFn:   () => notificationsAPI.getByUser(userId),
    enabled:   !!userId,
    staleTime: 10_000,
    select:    (res) => res.data ?? [],
  });
}

/**
 * Non-lues avec polling 60s.
 * Utilisé dans DashboardLayout pour le badge rouge.
 */
export function useNotifsNonLues(userId) {
  return useQuery({
    queryKey:        QK.notifications.nonLues(userId),
    queryFn:         () => notificationsAPI.getNonLues(userId),
    enabled:         !!userId,
    staleTime:       10_000,
    refetchInterval: 60_000, // À remplacer par SSE quand disponible
    select:          (res) => ({
      items: res.data ?? [],
      count: (res.data ?? []).length,
    }),
  });
}

export function useMarquerLue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsAPI.marquerCommeLue,
    onSuccess:  () => qc.invalidateQueries({ queryKey: QK.notifications.all() }),
  });
}

export function useMarquerToutesLues(userId) {
  const qc    = useQueryClient();
  const toast = useToast();
  return useMutation({
    mutationFn: () => notificationsAPI.marquerToutesLues(userId),
    // Optimistic : vide le badge immédiatement
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: QK.notifications.nonLues(userId) });
      const prev = qc.getQueryData(QK.notifications.nonLues(userId));
      qc.setQueryData(QK.notifications.nonLues(userId), () => ({ items: [], count: 0 }));
      return { prev };
    },
    onError: (error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK.notifications.nonLues(userId), ctx.prev);
      toast.error(getUserMessage(error));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: QK.notifications.all() }),
  });
}
