/**
 * lazyExports.js
 * Import dynamique des bibliothèques lourdes.
 *
 * RÈGLE D'OR : jsPDF, XLSX, PapaParse ne doivent JAMAIS apparaître
 * dans un import statique (ni dans les pages, ni dans les utils importés
 * statiquement). Sinon ils rejoignent le bundle initial.
 *
 * Ce fichier est le SEUL point d'entrée pour ces bibliothèques.
 * Elles sont chargées uniquement quand l'utilisateur clique sur "Exporter".
 *
 * Usage dans un composant :
 *   import { exportToExcelLazy } from '@/utils/lazyExports';
 *   const handleExport = async () => {
 *     setExporting(true);
 *     await exportToExcelLazy(data, columns, 'Salles', 'Salles');
 *     setExporting(false);
 *   };
 */

// ── Exports Excel (XLSX) ──────────────────────────────────────────────────

/**
 * Export Excel — charge XLSX uniquement quand appelé.
 * @param {Array} data
 * @param {Array} columns
 * @param {string} sheetName
 * @param {string} fileName
 */
export async function exportToExcelLazy(data, columns, sheetName, fileName) {
  const { exportToExcel } = await import('./exportExcel.js');
  return exportToExcel(data, columns, sheetName, fileName);
}

/**
 * Export multi-onglets (statistiques).
 */
export async function exportMultiSheetLazy(sheets, fileName) {
  const { exportMultiSheet } = await import('./exportExcel.js');
  return exportMultiSheet(sheets, fileName);
}

// ── Export PDF emploi du temps ────────────────────────────────────────────

/**
 * Génère le PDF emploi du temps — charge jsPDF + template uniquement quand appelé.
 * @param {Array}  affectations
 * @param {string} filename
 * @param {string} title
 * @param {string} role
 */
export async function exportToPDFLazy(affectations, filename, title, role) {
  const { exportToPDF } = await import('./exportEmploiDuTemps.js');
  return exportToPDF(affectations, filename, title, role);
}

// ── Hook intégré pour les boutons d'export ────────────────────────────────

/**
 * Hook qui wraps n'importe quelle fonction d'export avec :
 *   - état isPending
 *   - gestion d'erreur avec toast
 *
 * Usage :
 *   const { run: handleExport, isPending } = useExport(
 *     () => exportToExcelLazy(salles, COLS_SALLES, 'Salles', 'Salles')
 *   );
 *
 *   <Button onClick={handleExport} disabled={isPending}>
 *     {isPending ? 'Export...' : 'Exporter Excel'}
 *   </Button>
 */
export { useExport } from '../hooks/useExport.js';
