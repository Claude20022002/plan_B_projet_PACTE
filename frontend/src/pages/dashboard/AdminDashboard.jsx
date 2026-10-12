import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Add, ArrowForward } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { affectationAPI, conflitAPI, demandeReportAPI, presenceAPI, statistiquesAPI, suiviAPI } from '../../services/api';
import FileATraiter from '../../components/dashboard/FileATraiter';
import { aujourdhui } from '../../../../shared/dates.js';
import { DepartureBoard } from '../../design-system/board';
import { byStart, findSpotlight, toBoardSession, toLocalISODate } from '../../utils/session';
import { ds } from '../../design-system/tokens';
import useLiveRefresh from '../../hooks/useLiveRefresh';

const sectionTitleSx = {
  fontFamily: ds.font.board,
  fontWeight: 700,
  fontSize: '1rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

/** Bande réglée d'indicateurs : quatre chiffres lisibles d'un coup d'œil, qui mènent aux statistiques */
function IndicatorsStrip({ kpis, loading }) {
  const { t, i18n } = useTranslation();
  // Format de nombre de la langue (« 10,9 » en français, « 10.9 » en anglais)
  const number = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 });
  const navigate = useNavigate();
  const items = [
    { label: t('admin.occupancy'), value: kpis?.taux_occupation_salles?.valeur, unit: '%' },
    { label: t('admin.sessionsPlanned'), value: kpis?.taux_conflits?.detail?.total_affectations },
    { label: t('admin.activeTeachers'), value: kpis?.moyenne_heures_enseignant?.detail?.enseignants_actifs },
    { label: t('admin.conflictRate'), value: kpis?.taux_conflits?.valeur, unit: '%' },
  ];

  return (
    <Box component="section" aria-labelledby="indicators-title" sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: `${ds.radius.lg}px` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography id="indicators-title" component="h2" sx={sectionTitleSx}>
          {t('admin.indicators')}
        </Typography>
        <Button size="small" endIcon={<ArrowForward />} onClick={() => navigate('/statistiques')}>
          {t('nav.statistics')}
        </Button>
      </Box>
      {/* Lignes réglées libellé | valeur, comme une ligne de panneau (pas de chiffres géants) */}
      <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {items.map((item) => (
            <Box component="tr" key={item.label} sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}>
              <Box component="th" scope="row" sx={{ textAlign: 'left', px: 2, py: 1.25, fontWeight: 500, fontSize: '0.9375rem', color: 'text.secondary' }}>
                {item.label}
              </Box>
              <Box component="td" sx={{ textAlign: 'right', px: 2, py: 1.25, fontFamily: ds.font.board, fontWeight: 700, fontSize: '1.125rem', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                {loading ? <Skeleton width={48} sx={{ ml: 'auto' }} /> : item.value === undefined || item.value === null ? '-' : number.format(item.value)}
                {!loading && item.value !== undefined && item.value !== null && item.unit && (
                  <Box component="span" sx={{ ml: 0.25, fontSize: '0.875rem', color: 'text.secondary' }}>
                    {item.unit}
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}

const DAYS_AHEAD = 2;

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [conflictsTotal, setConflictsTotal] = useState(0);
  const [reports, setReports] = useState([]);
  const [telephones, setTelephones] = useState([]);
  const [aVerifier, setAVerifier] = useState(0);
  const [kpis, setKpis] = useState(null);
  const [building, setBuilding] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError(false);
    try {
      const [affectations, nonResolus, demandes, stats, telephones, visas] = await Promise.all([
        affectationAPI.getAll({
          date_from: toLocalISODate(),
          date_to: toLocalISODate(new Date(Date.now() + DAYS_AHEAD * 86400000)),
          // Les plus proches d'abord : la page est plafonnée à 100 séances par le serveur, et sans cet
          // ordre un campus chargé perdait les séances du jour au profit de celles du surlendemain
          ordre: 'asc',
          limit: 100,
        }),
        conflitAPI.getNonResolus({ limit: 5 }).catch(() => ({ data: [], pagination: { total: 0 } })),
        demandeReportAPI.getByStatut('en_attente').catch(() => []),
        statistiquesAPI.getKPIs().catch(() => null),
        // R-9 : changements de téléphone en attente, séances du mois à confirmer ou écarter avant la paie
        presenceAPI.demandesTelephone().catch(() => ({ data: [] })),
        suiviAPI.seancesAVerifier(aujourdhui().slice(0, 7)).catch(() => null),
      ]);
      setSessions((affectations?.data || []).map(toBoardSession).sort(byStart));
      setConflicts(nonResolus?.data || []);
      setConflictsTotal(nonResolus?.pagination?.total ?? (nonResolus?.data || []).length);
      setReports((demandes?.data || demandes || []).slice(0, 5));
      setKpis(stats?.kpis || null);
      setTelephones((telephones?.data || []).slice(0, 5));
      setAVerifier(visas?.a_verifier ?? 0);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useLiveRefresh(() => load({ silent: true }));

  const buildings = useMemo(() => [...new Set(sessions.map((s) => s.building).filter(Boolean))].sort(), [sessions]);
  const upcoming = useMemo(
    () => sessions.filter((s) => (!s.end || s.end > now) && (building === 'all' || s.building === building)),
    [sessions, now, building]
  );
  // Sur le campus, la lampe s'allume sur la prochaine séance qui démarre
  const spotlight = useMemo(() => findSpotlight(upcoming, now), [upcoming, now]);

  return (
    <DashboardLayout>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: { xs: 2, md: 3 } }}>
        {buildings.length > 1 && (
          <ToggleButtonGroup
            size="small"
            exclusive
            value={building}
            onChange={(_, value) => value && setBuilding(value)}
            aria-label={t('admin.filterBuilding')}
            sx={{ '& .MuiToggleButton-root': { fontFamily: ds.font.board, fontWeight: 600, letterSpacing: '0.06em', px: 1.5 } }}
          >
            <ToggleButton value="all">{t('admin.allBuildings')}</ToggleButton>
            {buildings.map((b) => (
              <ToggleButton key={b} value={b}>
                {b}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/gestion/affectations')}>
          {t('admin.planSession')}
        </Button>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => load()}>
              {t('common.retry')}
            </Button>
          }
        >
          {t('common.errorLoad')}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(300px, 1fr)' } }}>
        <Box sx={{ minWidth: 0 }}>
          <DepartureBoard
            title={t('admin.upcoming')}
            sessions={upcoming}
            loading={loading}
            spotlight={spotlight}
            columns={['time', 'course', 'group', 'room', 'status']}
            empty={
              <Box sx={{ color: ds.board.letter }}>
                <Typography component="p" sx={{ fontFamily: ds.font.board, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '1.125rem' }}>
                  {t('admin.campusEmpty')}
                </Typography>
                <Button variant="outlined" sx={{ mt: 2, color: ds.board.letter, borderColor: ds.board.seam }} onClick={() => navigate('/gestion/emplois-du-temps')}>
                  {t('nav.timetables')}
                </Button>
              </Box>
            }
          />
        </Box>
        <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, alignContent: 'start' }}>
          <FileATraiter conflicts={conflicts} conflictsTotal={conflictsTotal} reports={reports} telephones={telephones} aVerifier={aVerifier} loading={loading} />
          <IndicatorsStrip kpis={kpis} loading={loading} />
        </Box>
      </Box>
    </DashboardLayout>
  );
}
