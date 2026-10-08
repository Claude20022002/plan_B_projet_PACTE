import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button } from '@mui/material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import EnhancedTimetable from '../../components/emploi-du-temps/EnhancedTimetable';
import TimetableExportMenu from '../../components/emploi-du-temps/TimetableExportMenu';
import { chargerMesSeances } from '../../utils/mesSeances';
import { useAuth } from '../../contexts/AuthContext';

export default function EmploiDuTempsEtudiant() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [affectations, setAffectations] = useState([]);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id_user) return;
    setError(false);
    try {
      // Le semestre autour d'aujourd'hui : séances du groupe et des groupes parents (CM de promotion)
      const aujourdhui = new Date();
      const { seances } = await chargerMesSeances(new Date(aujourdhui.getTime() - 60 * 86400000), new Date(aujourdhui.getTime() + 180 * 86400000));
      setAffectations(seances);
    } catch {
      setError(true);
    }
  }, [user?.id_user]);

  useEffect(() => {
    load();
  }, [load]);

  const fileBase = `emploi-du-temps-${user?.prenom || ''}-${user?.nom || ''}`.toLowerCase();

  return (
    <DashboardLayout>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={load}>{t('common.retry')}</Button>}>
          {t('common.errorLoad')}
        </Alert>
      )}
      <EnhancedTimetable
        affectations={affectations}
        columns={['time', 'course', 'room', 'teacher', 'status']}
        actions={
          <TimetableExportMenu
            affectations={affectations}
            fileBase={fileBase}
            title={`${t('nav.timetable')} · ${user?.prenom || ''} ${user?.nom || ''}`}
            role="etudiant"
          />
        }
      />
    </DashboardLayout>
  );
}
