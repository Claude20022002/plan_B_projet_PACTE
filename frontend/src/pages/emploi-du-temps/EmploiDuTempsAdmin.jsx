import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Autocomplete, Box, Button, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import EnhancedTimetable from '../../components/emploi-du-temps/EnhancedTimetable';
import TimetableExportMenu from '../../components/emploi-du-temps/TimetableExportMenu';
import { affectationAPI, enseignantAPI, groupeAPI } from '../../services/api';
import { fetchAll } from '../../utils/fetchAll';
import { dansJours } from '../../../../shared/dates.js';
import { ds } from '../../design-system/tokens';
import OngletsEmploisDuTemps from '../../components/gestion/OngletsEmploisDuTemps';

/**
 * Vue admin : par défaut l'emploi du temps d'un groupe (comme les plannings PDF diffusés par l'école),
 * ou celui d'un enseignant, ou tout le campus.
 * Le serveur rend au plus 100 séances par page : un groupe ou un enseignant est chargé page par
 * page en entier ; tout le campus, sur une fenêtre de dates (sinon des milliers de séances).
 */

// Tout le campus : de la semaine passée aux huit semaines à venir
const FENETRE_CAMPUS = { avant: 7, apres: 56 };
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
        const [groupList, enseignantList, latest] = await Promise.all([
          fetchAll(groupeAPI.getAll),
          fetchAll(enseignantAPI.getAll),
          // Pour ouvrir directement sur un groupe qui a des séances planifiées
          affectationAPI.getAll({ limit: 1 }).catch(() => ({ data: [] })),
        ]);
        groupList.sort((a, b) => a.nom_groupe.localeCompare(b.nom_groupe));
        const withSessions = groupList.find((item) => item.id_groupe === latest?.data?.[0]?.id_groupe);
        setGroupes(groupList);
        setEnseignants(enseignantList);
        setGroupe((current) => current || withSessions || groupList[0] || null);
      } catch {
        setError(true);
      }
    })();
  }, []);

  const load = useCallback(async () => {
    setError(false);
    try {
      let seances = [];
      if (scope === 'groupe' && groupe) seances = await fetchAll((p) => affectationAPI.getByGroupe(groupe.id_groupe, p));
      else if (scope === 'enseignant' && enseignant) seances = await fetchAll((p) => affectationAPI.getByEnseignant(enseignant.id_user, p));
      else if (scope === 'all') seances = await fetchAll(affectationAPI.getAll, { date_from: dansJours(-FENETRE_CAMPUS.avant), date_to: dansJours(FENETRE_CAMPUS.apres), ordre: 'asc' });
      setAffectations(seances);
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

      {scope === 'all' && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('timetable.campusWindow', { weeks: FENETRE_CAMPUS.apres / 7 })}
        </Typography>
      )}

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
