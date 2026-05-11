/**
 * useStatistiques.js
 * Données analytiques — lecture seule, staleTime long, pas de mutations.
 *
 * Pattern : les données stats changent peu → staleTime 5 min.
 * Plusieurs queries en parallèle avec Promise.all implicite via React Query.
 */

import { useQuery, useQueries } from '@tanstack/react-query';
import { statistiquesAPI } from '../../services/domains/statistiques.api';
import { QK } from './_shared/queryKeys';

const STALE = 5 * 60_000; // 5 min

/** @param {{ date_debut?: string, date_fin?: string }} [params] */
export function useDashboardStats(params) {
  return useQuery({
    queryKey:  QK.statistiques.dashboard(params),
    queryFn:   () => statistiquesAPI.getDashboard(params),
    staleTime: STALE,
    select:    (res) => res.resume || res || {},
  });
}

/** KPIs analytiques (7 indicateurs). */
export function useKPIs(params) {
  return useQuery({
    queryKey:  QK.statistiques.kpis(params),
    queryFn:   () => statistiquesAPI.getKPIs(params),
    staleTime: STALE,
    select:    (res) => res.kpis || null,
  });
}

export function useChargeEnseignants(params) {
  return useQuery({
    queryKey:  QK.statistiques.enseignants(params),
    queryFn:   () => statistiquesAPI.getChargeEnseignants(params),
    staleTime: STALE,
    select:    (res) => res.charge_enseignants ?? [],
  });
}

export function useOccupationGroupes(params) {
  return useQuery({
    queryKey:  QK.statistiques.groupes(params),
    queryFn:   () => statistiquesAPI.getOccupationGroupes(params),
    staleTime: STALE,
    select:    (res) => res.occupation_groupes ?? [],
  });
}

/**
 * Charge toutes les données du dashboard en parallèle.
 * Plus efficace que 3 useQuery séparés : les requêtes partent simultanément.
 *
 * @param {{ date_debut?: string, date_fin?: string }} [params]
 * @returns {{ kpis, charge, groupes, isLoading, error }}
 */
export function useDashboardAll(params) {
  const results = useQueries({
    queries: [
      {
        queryKey:  QK.statistiques.kpis(params),
        queryFn:   () => statistiquesAPI.getKPIs(params),
        staleTime: STALE,
        select:    (res) => res.kpis || null,
      },
      {
        queryKey:  QK.statistiques.enseignants(params),
        queryFn:   () => statistiquesAPI.getChargeEnseignants(params),
        staleTime: STALE,
        select:    (res) => res.charge_enseignants ?? [],
      },
      {
        queryKey:  QK.statistiques.groupes(params),
        queryFn:   () => statistiquesAPI.getOccupationGroupes(params),
        staleTime: STALE,
        select:    (res) => res.occupation_groupes ?? [],
      },
    ],
  });

  return {
    kpis:      results[0].data,
    charge:    results[1].data ?? [],
    groupes:   results[2].data ?? [],
    isLoading: results.some((r) => r.isLoading),
    isFetching:results.some((r) => r.isFetching),
    error:     results.find((r) => r.error)?.error ?? null,
  };
}
