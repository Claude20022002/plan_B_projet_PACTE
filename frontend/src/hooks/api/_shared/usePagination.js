/**
 * usePagination.js
 * Gestion d'état de pagination découplée de la UI.
 *
 * Stratégie :
 *   - Garde page + rowsPerPage en état local
 *   - Reset automatique sur changement de filtre
 *   - Compatible React Query keepPreviousData
 *   - Peut être étendu pour sync URL
 *
 * Usage :
 *   const pg = usePagination({ defaultLimit: 10 });
 *   const { data } = useSallesList(pg.params);
 *
 *   <TablePagination
 *     count={data?.pagination.total ?? 0}
 *     page={pg.page}
 *     rowsPerPage={pg.rowsPerPage}
 *     onPageChange={pg.onPageChange}
 *     onRowsPerPageChange={pg.onRowsPerPageChange}
 *   />
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * @param {{ defaultPage?: number, defaultLimit?: number }} [opts]
 */
export function usePagination({ defaultPage = 0, defaultLimit = 10 } = {}) {
  const [page,        setPage]        = useState(defaultPage);
  const [rowsPerPage, setRowsPerPage] = useState(defaultLimit);

  /** Réinitialise à la page 0 (appeler quand les filtres changent). */
  const resetPage = useCallback(() => setPage(0), []);

  const onPageChange = useCallback((_evt, newPage) => setPage(newPage), []);

  const onRowsPerPageChange = useCallback((evt) => {
    setRowsPerPage(parseInt(evt.target.value, 10));
    setPage(0);
  }, []);

  /**
   * Params prêts à être passés à l'API.
   * Note : la plupart des backends attendent `page` à partir de 1.
   */
  const params = useMemo(() => ({
    page:  page + 1,
    limit: rowsPerPage,
  }), [page, rowsPerPage]);

  return {
    page,
    rowsPerPage,
    params,
    resetPage,
    onPageChange,
    onRowsPerPageChange,
    rowsPerPageOptions: [5, 10, 25, 50],
  };
}
