/**
 * useMemoized.js
 * Hooks de memoization pour éviter les re-renders coûteux.
 *
 * Règles React Performance :
 *   - useMemo : calculs coûteux sur données (filter, sort, group, aggregate)
 *   - useCallback : handlers passés en props à des composants React.memo()
 *   - React.memo() : composants purs qui reçoivent des props stables
 *
 * Anti-patterns à éviter :
 *   ❌ useMemo sur calculs triviaux (1-2 opérations simples)
 *   ❌ useCallback sans React.memo en face
 *   ❌ React.memo sans useMemo/useCallback sur les props
 */

import { useMemo, useCallback, useRef } from 'react';

// ── Données filtrées / recherche ──────────────────────────────────────────

/**
 * Filtre un tableau par recherche textuelle sur plusieurs champs.
 * Memoïsé : ne recalcule que quand data ou search changent.
 *
 * @param {Array} data
 * @param {string} search
 * @param {string[]} fields - champs dans lesquels chercher
 * @returns {Array}
 *
 * Usage :
 *   const filtered = useSearchFilter(salles, search, ['nom_salle', 'batiment']);
 */
export function useSearchFilter(data, search, fields) {
  return useMemo(() => {
    if (!search?.trim()) return data;
    const q = search.toLowerCase().trim();
    return data.filter((item) =>
      fields.some((field) => String(item[field] ?? '').toLowerCase().includes(q)),
    );
  }, [data, search, fields]);
}

/**
 * Groupe un tableau par une clé.
 * Memoïsé : utile pour les graphiques et les vues groupées.
 *
 * @param {Array} data
 * @param {string} key
 * @returns {Record<string, Array>}
 */
export function useGroupBy(data, key) {
  return useMemo(() => {
    return data.reduce((acc, item) => {
      const group = String(item[key] ?? 'Autre');
      if (!acc[group]) acc[group] = [];
      acc[group].push(item);
      return acc;
    }, {});
  }, [data, key]);
}

/**
 * Tri memoïsé avec direction.
 *
 * @param {Array} data
 * @param {{ key: string | null, dir: 'asc' | 'desc' }} sort
 * @returns {Array}
 */
export function useSortedData(data, sort) {
  return useMemo(() => {
    if (!sort?.key) return data;
    return [...data].sort((a, b) => {
      const av = a[sort.key] ?? '';
      const bv = b[sort.key] ?? '';
      const cmp = String(av).localeCompare(String(bv), 'fr', { sensitivity: 'base' });
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [data, sort]);
}

/**
 * Stats agrégées memoïsées (count, sum, avg).
 * Évite de recalculer à chaque render.
 *
 * @param {Array} data
 * @param {string} numericField
 * @returns {{ count: number, sum: number, avg: number, min: number, max: number }}
 */
export function useAggregates(data, numericField) {
  return useMemo(() => {
    if (!data.length) return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    const values = data.map((d) => Number(d[numericField]) || 0);
    const sum    = values.reduce((a, b) => a + b, 0);
    return {
      count: data.length,
      sum,
      avg: sum / data.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [data, numericField]);
}

// ── Handlers stables (pour React.memo) ───────────────────────────────────

/**
 * Crée des handlers stables pour les opérations CRUD.
 * useCallback garantit que les références ne changent pas entre renders.
 *
 * Utiliser uniquement quand les handlers sont passés à des composants React.memo().
 *
 * @param {{
 *   onCreate: (data: any) => void,
 *   onEdit: (item: any) => void,
 *   onDelete: (id: number) => void,
 *   onView?: (item: any) => void,
 * }} handlers
 */
export function useCrudHandlers({ onCreate, onEdit, onDelete, onView }) {
  const handleCreate = useCallback(() => onCreate?.(),   [onCreate]);
  const handleEdit   = useCallback((item) => onEdit?.(item),   [onEdit]);
  const handleDelete = useCallback((id) => onDelete?.(id),     [onDelete]);
  const handleView   = useCallback((item) => onView?.(item),   [onView]);

  return { handleCreate, handleEdit, handleDelete, handleView };
}

// ── Ref stable pour éviter les closures périmées ──────────────────────────

/**
 * Garde une référence toujours à jour vers une valeur, sans la rendre dépendance.
 * Utile pour les callbacks qui capturent des valeurs changeantes.
 *
 * @param {T} value
 * @returns {React.MutableRefObject<T>}
 *
 * Usage :
 *   const filterRef = useLatestRef(filters);
 *   const handleExport = useCallback(() => {
 *     // filterRef.current a toujours la dernière valeur des filtres
 *     exportData(filterRef.current);
 *   }, []); // pas de dépendance sur filters
 */
export function useLatestRef(value) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

// ── Debounce memoïsé ──────────────────────────────────────────────────────

/**
 * Valeur debouncée — utile pour la recherche temps réel.
 * Évite d'appeler l'API à chaque frappe.
 *
 * @param {string} value
 * @param {number} [delay=300]
 * @returns {string}
 *
 * Usage :
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounce(search, 300);
 *   const { items } = useSallesList({ search: debouncedSearch });
 */
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
