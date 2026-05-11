/**
 * useFilters.js
 * Gestion d'état des filtres avec reset auto de la pagination.
 *
 * Design :
 *   - Immutable update des filtres (spread)
 *   - Reset individuel ou total
 *   - Callback onReset pour notifier la pagination
 *   - Valeurs null/undefined filtrées avant envoi à l'API
 *
 * Usage :
 *   const pg = usePagination();
 *   const filters = useFilters(
 *     { statut: 'all', search: '' },
 *     { onFilterChange: pg.resetPage }
 *   );
 *
 *   // Dans un Select :
 *   <Select value={filters.values.statut}
 *     onChange={(e) => filters.set('statut', e.target.value)} />
 *
 *   // Params pour l'API (valeurs vides ignorées) :
 *   const { data } = useSallesList({ ...pg.params, ...filters.apiParams });
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * @template {Record<string, unknown>} T
 * @param {T} initialValues
 * @param {{ onFilterChange?: () => void }} [opts]
 */
export function useFilters(initialValues, { onFilterChange } = {}) {
  const [values, setValues] = useState(initialValues);

  /**
   * Met à jour un filtre unique.
   * @param {keyof T} key
   * @param {unknown} value
   */
  const set = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    onFilterChange?.();
  }, [onFilterChange]);

  /**
   * Met à jour plusieurs filtres en une fois.
   * @param {Partial<T>} patch
   */
  const setMany = useCallback((patch) => {
    setValues((prev) => ({ ...prev, ...patch }));
    onFilterChange?.();
  }, [onFilterChange]);

  /** Remet tous les filtres à leur valeur initiale. */
  const reset = useCallback(() => {
    setValues(initialValues);
    onFilterChange?.();
  }, [initialValues, onFilterChange]);

  /** Remet un filtre unique à sa valeur initiale. */
  const resetOne = useCallback((key) => {
    setValues((prev) => ({ ...prev, [key]: initialValues[key] }));
    onFilterChange?.();
  }, [initialValues, onFilterChange]);

  /**
   * Paramètres nettoyés (sans '', null, undefined, 'all') prêts pour l'API.
   * Personnaliser la liste des valeurs "vides" selon le contexte.
   */
  const apiParams = useMemo(() => {
    return Object.fromEntries(
      Object.entries(values).filter(([, v]) => {
        if (v === null || v === undefined) return false;
        if (v === '') return false;
        if (v === 'all') return false;  // Convention UI pour "pas de filtre"
        return true;
      }),
    );
  }, [values]);

  /** Indique si au moins un filtre est actif (différent de la valeur initiale). */
  const hasActiveFilters = useMemo(() => {
    return Object.keys(initialValues).some((k) => values[k] !== initialValues[k]);
  }, [values, initialValues]);

  return { values, apiParams, set, setMany, reset, resetOne, hasActiveFilters };
}
