/**
 * notifications.queries.js
 * React Query hooks pour les notifications.
 * staleTime court : notifications doivent être fraîches.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI } from '../domains/notifications.api.js';

export const NOTIFS_KEYS = {
  all:      () => ['notifications'],
  byUser:   (id) => ['notifications', 'user', id],
  nonLues:  (id) => ['notifications', 'user', id, 'non-lues'],
};

export function useNotifications(userId) {
  return useQuery({
    queryKey: NOTIFS_KEYS.byUser(userId),
    queryFn:  () => notificationsAPI.getByUser(userId),
    enabled:  !!userId,
    staleTime: 10_000,
    select:   (res) => res.data || [],
  });
}

export function useNotifsNonLues(userId) {
  return useQuery({
    queryKey: NOTIFS_KEYS.nonLues(userId),
    queryFn:  () => notificationsAPI.getNonLues(userId),
    enabled:  !!userId,
    staleTime: 10_000,
    refetchInterval: 60_000, // Polling toutes les 60s (remplacer par SSE plus tard)
    select:   (res) => res.data || [],
  });
}

export function useMarquerLue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsAPI.marquerCommeLue,
    onSuccess:  () => qc.invalidateQueries({ queryKey: NOTIFS_KEYS.all() }),
  });
}

export function useMarquerToutesLues(userId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsAPI.marquerToutesLues(userId),
    onSuccess:  () => qc.invalidateQueries({ queryKey: NOTIFS_KEYS.all() }),
  });
}
