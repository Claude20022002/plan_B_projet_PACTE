/**
 * VirtualTable.jsx
 * Tableau virtualisé avec react-window — affiche 10 000 lignes sans lag.
 *
 * Rend uniquement les lignes visibles dans le viewport.
 * Pour les tableaux paginés < 100 lignes, utiliser le TableContainer MUI standard.
 * Pour les tableaux > 500 lignes non paginés (affectations, logs), utiliser ce composant.
 *
 * Props :
 *   columns  — définition des colonnes
 *   rows     — toutes les données (react-window gère le rendu virtuel)
 *   height   — hauteur du conteneur en px (défaut: 500)
 *   rowHeight— hauteur d'une ligne en px (défaut: 52)
 *   onRowClick — callback quand on clique une ligne
 *
 * Usage :
 *   <VirtualTable
 *     columns={[
 *       { key: 'nom', header: 'Nom', width: 200 },
 *       { key: 'email', header: 'Email', flex: 1 },
 *       { key: 'role', header: 'Rôle', width: 120, render: (v) => <Chip label={v} /> },
 *     ]}
 *     rows={utilisateurs}
 *     height={600}
 *   />
 */

import { memo, useCallback } from 'react';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  Table, TableHead, TableRow, TableCell,
  TableBody, Box, Typography,
} from '@mui/material';

// ── Ligne virtualisée — mémoïsée pour éviter les re-renders ──────────────
const VirtualRow = memo(function VirtualRow({ index, style, data }) {
  const { rows, columns, onRowClick, selectedId, getRowId } = data;
  const row    = rows[index];
  const rowId  = getRowId(row);
  const isOdd  = index % 2 === 1;
  const isSel  = rowId === selectedId;

  return (
    <TableRow
      component="div"
      hover
      selected={isSel}
      onClick={() => onRowClick?.(row)}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        cursor: onRowClick ? 'pointer' : 'default',
      }}
      sx={{
        bgcolor: isSel
          ? 'action.selected'
          : isOdd ? 'action.hover' : 'background.paper',
        '&:hover': { bgcolor: 'action.hover' },
        transition: 'background-color 0.1s',
        boxSizing: 'border-box',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      {columns.map((col) => (
        <TableCell
          key={col.key}
          component="div"
          style={{
            width:    col.width  ?? undefined,
            flex:     col.flex   ?? undefined,
            minWidth: col.minWidth ?? col.width ?? 80,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            height: '100%',
            padding: '0 16px',
            borderBottom: 'none',
          }}
          sx={{ fontSize: 13 }}
        >
          {col.render ? col.render(row[col.key], row, index) : row[col.key] ?? '—'}
        </TableCell>
      ))}
    </TableRow>
  );
});

// ── En-tête fixe ──────────────────────────────────────────────────────────
const VirtualHeader = memo(function VirtualHeader({ columns, onSort, sortKey, sortDir }) {
  return (
    <Table component="div" sx={{ display: 'block' }}>
      <TableHead component="div">
        <TableRow
          component="div"
          sx={{ display: 'flex', bgcolor: 'background.paper' }}
        >
          {columns.map((col) => (
            <TableCell
              key={col.key}
              component="div"
              sortDirection={sortKey === col.key ? sortDir : false}
              style={{
                width:    col.width ?? undefined,
                flex:     col.flex  ?? undefined,
                minWidth: col.minWidth ?? col.width ?? 80,
                display: 'flex', alignItems: 'center',
                padding: '8px 16px',
                borderBottom: '2px solid',
                fontWeight: 700,
                fontSize: 13,
                cursor: col.sortable ? 'pointer' : 'default',
                userSelect: 'none',
              }}
              onClick={() => col.sortable && onSort?.(col.key)}
            >
              {col.header}
              {col.sortable && sortKey === col.key && (
                <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
              )}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
    </Table>
  );
});

// ── Composant principal ───────────────────────────────────────────────────
/**
 * @param {{
 *   columns: Array<{
 *     key: string,
 *     header: string,
 *     width?: number,
 *     flex?: number,
 *     minWidth?: number,
 *     sortable?: boolean,
 *     render?: (value: any, row: any, index: number) => React.ReactNode
 *   }>,
 *   rows: Array<any>,
 *   height?: number,
 *   rowHeight?: number,
 *   onRowClick?: (row: any) => void,
 *   selectedId?: string | number,
 *   getRowId?: (row: any) => string | number,
 *   onSort?: (key: string) => void,
 *   sortKey?: string,
 *   sortDir?: 'asc' | 'desc',
 *   emptyText?: string,
 * }} props
 */
export default function VirtualTable({
  columns,
  rows,
  height = 500,
  rowHeight = 52,
  onRowClick,
  selectedId,
  getRowId = (r) => r.id ?? r.id_user ?? r.id_salle ?? r.id_affectation,
  onSort,
  sortKey,
  sortDir,
  emptyText = 'Aucun élément',
}) {
  // Données itemData passées à chaque ligne (stable ref via useCallback)
  const itemData = {
    rows, columns, onRowClick, selectedId, getRowId,
  };

  if (rows.length === 0) {
    return (
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height, bgcolor: 'background.paper', borderRadius: 1,
      }}>
        <Typography color="text.disabled">{emptyText}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
      {/* En-tête fixe (hors du scroll) */}
      <VirtualHeader
        columns={columns}
        onSort={onSort}
        sortKey={sortKey}
        sortDir={sortDir}
      />

      {/* Corps virtualisé */}
      <Box style={{ height }}>
        <AutoSizer disableHeight>
          {({ width }) => (
            <FixedSizeList
              height={height}
              width={width}
              itemCount={rows.length}
              itemSize={rowHeight}
              itemData={itemData}
              overscanCount={5}  // Lignes pré-rendues hors viewport (smooth scroll)
            >
              {VirtualRow}
            </FixedSizeList>
          )}
        </AutoSizer>
      </Box>

      {/* Info ligne count */}
      <Box sx={{
        px: 2, py: 1,
        bgcolor: 'background.default',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}>
        <Typography variant="caption" color="text.secondary">
          {rows.length.toLocaleString('fr-FR')} enregistrement(s)
        </Typography>
      </Box>
    </Box>
  );
}
