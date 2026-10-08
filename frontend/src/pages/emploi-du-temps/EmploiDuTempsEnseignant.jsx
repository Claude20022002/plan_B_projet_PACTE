import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button } from '@mui/material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import EnhancedTimetable from '../../components/emploi-du-temps/EnhancedTimetable';
import TimetableExportMenu from '../../components/emploi-du-temps/TimetableExportMenu';
import { affectationAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function EmploiDuTempsEnseignant() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [affectations, setAffectations] = useState([]);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!user?.id_user) return;
    setError(false);
    try {
      const response = await affectationAPI.getByEnseignant(user.id_user, { limit: 1000 });
      setAffectations(response?.data || []);
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
        columns={['time', 'course', 'group', 'room', 'status']}
        actions={
          <TimetableExportMenu
            affectations={affectations}
            fileBase={fileBase}
            title={`${t('nav.timetable')} · ${user?.prenom || ''} ${user?.nom || ''}`}
            role="enseignant"
          />
        }
      />
    </DashboardLayout>
  );
}
