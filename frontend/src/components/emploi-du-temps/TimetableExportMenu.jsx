import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Menu, MenuItem } from '@mui/material';
import { Download } from '@mui/icons-material';
import { exportToExcelLazy, exportToPDFLazy } from '../../utils/lazyExports';

/**
 * Téléchargement de l'emploi du temps affiché, en trois entrées (lot B-6) : le PDF officiel,
 * l'Excel, et l'abonnement à son agenda (page Paramètres), qui se met à jour tout seul.
 * Les bibliothèques d'export ne sont chargées qu'au clic.
 */
export default function TimetableExportMenu({ affectations, fileBase, title, role }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);

  const run = (exporter) => async () => {
    setAnchor(null);
    await exporter();
  };

  return (
    <>
      <Button variant="outlined" startIcon={<Download />} onClick={(e) => setAnchor(e.currentTarget)} disabled={!affectations?.length}>
        {t('timetable.download')}
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <MenuItem onClick={run(() => exportToPDFLazy(affectations, fileBase, title, role))}>{t('timetable.downloadPdf')}</MenuItem>
        <MenuItem onClick={run(() => exportToExcelLazy(affectations, [], 'EmploiDuTemps', fileBase))}>{t('timetable.downloadExcel')}</MenuItem>
        {role === 'etudiant' && <MenuItem onClick={run(() => navigate('/emploi-du-temps/mensuel'))}>{t('timetable.monthView')}</MenuItem>}
        <MenuItem onClick={run(() => navigate('/parametres'))}>{t('timetable.subscribeAgenda')}</MenuItem>
      </Menu>
    </>
  );
}
