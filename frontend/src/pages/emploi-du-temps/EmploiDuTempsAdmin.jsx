import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Autocomplete, Box, Button, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import EnhancedTimetable from '../../components/emploi-du-temps/EnhancedTimetable';
import TimetableExportMenu from '../../components/emploi-du-temps/TimetableExportMenu';
import { affectationAPI, enseignantAPI, groupeAPI } from '../../services/api';
import { ds } from '../../design-system/tokens';
import OngletsEmploisDuTemps from '../../components/gestion/OngletsEmploisDuTemps';

/**
 * Vue admin : par défaut l'emploi du temps d'un groupe (comme les plannings PDF diffusés par l'école),
 * ou celui d'un enseignant, ou tout le campus.
 */
export default function EmploiDuTempsAdmin() {
  const { t } = useTranslation();
  const [scope, setScope] = useState('groupe');
  const [groupes, setGroupes] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [groupe, setGroupe] = useState(null);
  const [enseignant, setEnseignant] = useState(null);
  const [affectations, setAffectations] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [g, e, latest] = await Promise.all([
          groupeAPI.getAll({ limit: 1000 }),
          enseignantAPI.getAll({ limit: 1000 }),
          // Pour ouvrir directement sur un groupe qui a des séances planifiées
          affectationAPI.getAll({ limit: 1 }).catch(() => ({ data: [] })),
        ]);
        const groupList = (g?.data || []).sort((a, b) => a.nom_groupe.localeCompare(b.nom_groupe));
        const withSessions = groupList.find((item) => item.id_groupe === latest?.data?.[0]?.id_groupe);
        setGroupes(groupList);
        setEnseignants(e?.data || []);
        setGroupe((current) => current || withSessions || groupList[0] || null);
      } catch {
        setError(true);
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setError(false);
    try {
      let response = { data: [] };
      if (scope === 'groupe' && groupe) response = await affectationAPI.getByGroupe(groupe.id_groupe, { limit: 1000 });
      else if (scope === 'enseignant' && enseignant) response = await affectationAPI.getByEnseignant(enseignant.id_user, { limit: 1000 });
      else if (scope === 'all') response = await affectationAPI.getAll({ limit: 1000 });
      setAffectations(response?.data || []);
    } catch {
      setError(true);
    }
  }, [scope, groupe, enseignant]);

  useEffect(() => {
    load();
  }, [load]);

  const teacherName = (ens) => [ens?.user?.prenom, ens?.user?.nom].filter(Boolean).join(' ');
  const subject = scope === 'groupe' ? groupe?.nom_groupe : scope === 'enseignant' ? teacherName(enseignant) : t('timetable.filterAll');

  return (
    <DashboardLayout>
      <OngletsEmploisDuTemps />
      <Box className="hp-no-print" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={scope}
          onChange={(_, value) => value && setScope(value)}
          aria-label={t('timetable.filterBy')}
          sx={{ '& .MuiToggleButton-root': { fontFamily: ds.font.board, fontWeight: 600, letterSpacing: '0.06em', px: 1.5 } }}
        >
          <ToggleButton value="groupe">{t('timetable.filterGroup')}</ToggleButton>
          <ToggleButton value="enseignant">{t('timetable.filterTeacher')}</ToggleButton>
          <ToggleButton value="all">{t('timetable.filterAll')}</ToggleButton>
        </ToggleButtonGroup>
        {scope === 'groupe' && (
          <Autocomplete
            size="small"
            sx={{ minWidth: 220 }}
            options={groupes}
            value={groupe}
            onChange={(_, value) => setGroupe(value)}
            getOptionLabel={(g) => g.nom_groupe}
            isOptionEqualToValue={(a, b) => a.id_groupe === b.id_groupe}
            renderInput={(params) => <TextField {...params} label={t('timetable.chooseGroup')} />}
          />
        )}
        {scope === 'enseignant' && (
          <Autocomplete
            size="small"
            sx={{ minWidth: 260 }}
            options={enseignants}
            value={enseignant}
            onChange={(_, value) => setEnseignant(value)}
            getOptionLabel={teacherName}
            isOptionEqualToValue={(a, b) => a.id_user === b.id_user}
            renderInput={(params) => <TextField {...params} label={t('timetable.chooseTeacher')} />}
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} action={<Button color="inherit" size="small" onClick={load}>{t('common.retry')}</Button>}>
          {t('common.errorLoad')}
        </Alert>
      )}

      <EnhancedTimetable
        key={`${scope}-${groupe?.id_groupe ?? ''}-${enseignant?.id_user ?? ''}`}
        affectations={affectations}
        columns={['time', 'course', 'group', 'room', 'teacher', 'status']}
        actions={
          <TimetableExportMenu
            affectations={affectations}
            fileBase={`emploi-du-temps-${(subject || 'campus').toLowerCase().replace(/\s+/g, '-')}`}
            title={[t('nav.timetable'), subject].filter(Boolean).join(' · ')}
            role="admin"
          />
        }
      />
    </DashboardLayout>
  );
}
