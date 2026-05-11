/**
 * statistiques.queries.js
 * React Query hooks pour les statistiques et KPIs.
 *
 * staleTime élevé (5 min) : les KPIs ne changent pas à chaque seconde.
 */

import { useQuery } from '@tanstack/react-query';
import { statistiquesAPI } from '../domains/statistiques.api.js';

const STALE = 5 * 60_000; // 5 minutes

export const STATS_KEYS = {
  all:         () => ['statistiques'],
  dashboard:   (p) => ['statistiques', 'dashboard', p ?? {}],
  kpis:        (p) => ['statistiques', 'kpis', p ?? {}],
  salles:      (p) => ['statistiques', 'salles', p ?? {}],
  enseignants: (p) => ['statistiques', 'enseignants', p ?? {}],
  groupes:     (p) => ['statistiques', 'groupes', p ?? {}],
  pics:        (p) => ['statistiques', 'pics', p ?? {}],
};

/** @param {{ date_debut?: string, date_fin?: string }} [params] */
export function useDashboard(params) {
  return useQuery({
    queryKey: STATS_KEYS.dashboard(params),
    queryFn:  () => statistiquesAPI.getDashboard(params),
    staleTime: STALE,
    select:   (res) => res.resume || res || {},
  });
}

/** KPIs analytiques (7 indicateurs). */
export function useKPIs(params) {
  return useQuery({
    queryKey: STATS_KEYS.kpis(params),
    queryFn:  () => statistiquesAPI.getKPIs(params),
    staleTime: STALE,
    select:   (res) => res.kpis || null,
  });
}

/** Occupation des salles avec graphique par salle. */
export function useOccupationSalles(params) {
  return useQuery({
    queryKey: STATS_KEYS.salles(params),
    queryFn:  () => statistiquesAPI.getOccupationSalles(params),
    staleTime: STALE,
  });
}

/** Charge horaire par enseignant. */
export function useChargeEnseignants(params) {
  return useQuery({
    queryKey: STATS_KEYS.enseignants(params),
    queryFn:  () => statistiquesAPI.getChargeEnseignants(params),
    staleTime: STALE,
    select:   (res) => res.charge_enseignants || [],
  });
}

/** Volume horaire par groupe. */
export function useOccupationGroupes(params) {
  return useQuery({
    queryKey: STATS_KEYS.groupes(params),
    queryFn:  () => statistiquesAPI.getOccupationGroupes(params),
    staleTime: STALE,
    select:   (res) => res.occupation_groupes || [],
  });
}
