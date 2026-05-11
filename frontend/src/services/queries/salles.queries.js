/**
 * salles.queries.js
 * React Query hooks pour les salles.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { sallesAPI } from '../domains/salles.api.js';

export const SALLES_KEYS = {
  all:        () => ['salles'],
  list:       (p) => ['salles', 'list', p ?? {}],
  detail:     (id) => ['salles', 'detail', id],
  disponibles:(p) => ['salles', 'disponibles', p ?? {}],
};

export function useSalles(params) {
  return useQuery({
    queryKey: SALLES_KEYS.list(params),
    queryFn:  () => sallesAPI.getAll(params),
    placeholderData: keepPreviousData,
    select:   (res) => ({
      items:      res.data || [],
      pagination: res.pagination || {},
    }),
  });
}

export function useSalle(id) {
  return useQuery({
    queryKey: SALLES_KEYS.detail(id),
    queryFn:  () => sallesAPI.getById(id),
    enabled:  !!id,
    select:   (res) => res.data,
  });
}

/** Salles disponibles pour un créneau/date donné. */
export function useSallesDisponibles(params) {
  return useQuery({
    queryKey: SALLES_KEYS.disponibles(params),
    queryFn:  () => sallesAPI.getDisponibles(params),
    enabled:  !!(params?.id_creneau && params?.date_seance),
    select:   (res) => res.data || [],
  });
}

export function useCreateSalle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sallesAPI.create,
    onSuccess:  () => qc.invalidateQueries({ queryKey: SALLES_KEYS.all() }),
  });
}

export function useUpdateSalle(id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => sallesAPI.update(id, data),
    onSuccess:  () => qc.invalidateQueries({ queryKey: SALLES_KEYS.all() }),
  });
}

export function useDeleteSalle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sallesAPI.delete,
    onSuccess:  () => qc.invalidateQueries({ queryKey: SALLES_KEYS.all() }),
  });
}
