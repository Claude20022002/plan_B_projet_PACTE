import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Menu, MenuItem } from '@mui/material';
import { Download } from '@mui/icons-material';
import { exportToCSVLazy, exportToExcelLazy, exportToiCalLazy, exportToPDFLazy, exportToYAMLLazy } from '../../utils/lazyExports';

/**
 * Téléchargement de l'emploi du temps affiché (PDF, Excel, CSV, iCal, YAML).
 * Les bibliothèques d'export ne sont chargées qu'au clic.
 */
export default function TimetableExportMenu({ affectations, fileBase, title, role }) {
  const { t } = useTranslation();
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
        <MenuItem onClick={run(() => exportToCSVLazy(affectations, fileBase))}>{t('timetable.downloadCsv')}</MenuItem>
        <MenuItem onClick={run(() => exportToiCalLazy(affectations, fileBase, title))}>{t('timetable.downloadIcal')}</MenuItem>
        <MenuItem onClick={run(() => exportToYAMLLazy(affectations, fileBase, { etablissement: 'HESTIM' }))}>{t('timetable.downloadYaml')}</MenuItem>
      </Menu>
    </>
  );
}
