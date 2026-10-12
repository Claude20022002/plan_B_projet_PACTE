import { affectationAPI } from '../services/api';
import { fetchAll } from './fetchAll';
import { exportToExcelLazy } from './lazyExports';
import { COLS_AFFECTATIONS } from './exportColumns';

/**
 * Export Excel de toutes les séances. Le serveur rend au plus 100 séances par page : elles sont
 * chargées page par page (une seule requête à 10 000 n'en rendait que 100).
 */
export async function exporterToutesLesSeances() {
    await exportToExcelLazy(await fetchAll(affectationAPI.getAll), COLS_AFFECTATIONS, 'Affectations', 'Affectations');
}
