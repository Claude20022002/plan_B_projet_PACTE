import { useState, useMemo } from 'react';

/**
 * Hook de tri pour les tableaux MUI.
 *
 * Usage :
 *   const { sorted, requestSort, getSortDir } = useSortableTable(rows);
 *
 *   // Dans l'en-tête :
 *   <TableSortLabel
 *       active={getSortDir('nom') !== undefined}
 *       direction={getSortDir('nom') || 'asc'}
 *       onClick={() => requestSort('nom')}
 *   >Nom</TableSortLabel>
 *
 *   // Dans le corps : utiliser `sorted` au lieu du tableau original
 */
export function useSortableTable(data = []) {
    const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc' });

    const sorted = useMemo(() => {
        if (!sortConfig.key) return data;
        return [...data].sort((a, b) => {
            const av = a[sortConfig.key] ?? '';
            const bv = b[sortConfig.key] ?? '';
            const cmp = String(av).localeCompare(String(bv), 'fr', { sensitivity: 'base' });
            return sortConfig.dir === 'asc' ? cmp : -cmp;
        });
    }, [data, sortConfig]);

    const requestSort = (key) => {
        setSortConfig(prev => ({
            key,
            dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc',
        }));
    };

    /** Retourne 'asc' | 'desc' si la colonne est active, undefined sinon */
    const getSortDir = (key) => (sortConfig.key === key ? sortConfig.dir : undefined);

    return { sorted, requestSort, getSortDir };
}
