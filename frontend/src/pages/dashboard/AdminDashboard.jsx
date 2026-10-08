import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, ButtonBase, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { Add, ArrowForward } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { affectationAPI, conflitAPI, demandeReportAPI, statistiquesAPI } from '../../services/api';
import { DepartureBoard } from '../../design-system/board';
import { byStart, findSpotlight, formatDayLabel, toBoardSession, toLocalISODate } from '../../utils/session';
import { ds } from '../../design-system/tokens';
import useLiveRefresh from '../../hooks/useLiveRefresh';

const sectionTitleSx = {
  fontFamily: ds.font.board,
  fontWeight: 700,
  fontSize: '1rem',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
};

/** File « À traiter » : conflits ouverts et demandes de report en attente, du plus urgent au moins urgent */
function QueuePanel({ conflicts, conflictsTotal, reports, loading }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const empty = !loading && conflicts.length === 0 && reports.length === 0;

  const Row = ({ tone, title, detail, onClick }) => (
    <Box component="li" sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}>
      <ButtonBase onClick={onClick} sx={{ width: '100%', display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 2, py: 1.5, textAlign: 'left', '&:hover': { bgcolor: 'action.hover' } }}>
        <Box component="span" aria-hidden="true" sx={{ mt: '7px', width: 8, height: 8, borderRadius: '50%', flexShrink: 0, bgcolor: tone }} />
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.35 }}>{title}</Typography>
          <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: '0.875rem', lineHeight: 1.45, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {detail}
          </Typography>
        </Box>
        <ArrowForward fontSize="small" sx={{ mt: '2px', color: 'text.secondary' }} />
      </ButtonBase>
    </Box>
  );

  return (
    <Box component="section" aria-labelledby="queue-title" sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: `${ds.radius.lg}px`, alignSelf: 'start' }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography id="queue-title" component="h2" sx={sectionTitleSx}>
          {t('admin.toHandle')}
        </Typography>
        {!loading && !empty && (
          <Typography sx={{ mt: 0.25, color: 'text.secondary', fontSize: '0.875rem' }}>
            {[
              conflictsTotal ? t('admin.openConflicts', { count: conflictsTotal }) : null,
              reports.length ? t('admin.pendingReports', { count: reports.length }) : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
        )}
      </Box>

      {loading && (
        <Box sx={{ p: 2, display: 'grid', gap: 1.5 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rectangular" height={44} sx={{ borderRadius: '3px' }} />
          ))}
        </Box>
      )}

      {empty && <Typography sx={{ px: 2, py: 2.5, color: 'text.secondary', fontSize: '0.9375rem' }}>{t('admin.nothingToHandle')}</Typography>}

      {!loading && !empty && (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {conflicts.map((c) => (
            <Row
              key={`c-${c.id_conflit}`}
              tone={ds.colors.danger.text}
              title={t(`admin.conflictType.${c.type_conflit}`, { defaultValue: c.type_conflit })}
              detail={c.description}
              onClick={() => navigate('/gestion/conflits')}
            />
          ))}
          {reports.map((r) => (
            <Row
              key={`r-${r.id_demande}`}
              tone={ds.colors.warning.text}
              title={t('admin.reportTitle', {
                teacher: [r.enseignant?.prenom, r.enseignant?.nom].filter(Boolean).join(' ') || '-',
              })}
              detail={[
                r.affectation?.cours?.nom_cours,
                r.nouvelle_date ? t('admin.reportTo', { date: formatDayLabel(String(r.nouvelle_date).slice(0, 10), i18n.language) }) : null,
              ]
                .filter(Boolean)
                .join(' · ')}
              onClick={() => navigate('/gestion/demandes-report')}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

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
      const [affectations, nonResolus, demandes, stats] = await Promise.all([
        affectationAPI.getAll({
          date_from: toLocalISODate(),
          date_to: toLocalISODate(new Date(Date.now() + DAYS_AHEAD * 86400000)),
          limit: 400,
        }),
        conflitAPI.getNonResolus({ limit: 5 }).catch(() => ({ data: [], pagination: { total: 0 } })),
        demandeReportAPI.getByStatut('en_attente').catch(() => []),
        statistiquesAPI.getKPIs().catch(() => null),
      ]);
      setSessions((affectations?.data || []).map(toBoardSession).sort(byStart));
      setConflicts(nonResolus?.data || []);
      setConflictsTotal(nonResolus?.pagination?.total ?? (nonResolus?.data || []).length);
      setReports((demandes?.data || demandes || []).slice(0, 5));
      setKpis(stats?.kpis || null);
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
          <QueuePanel conflicts={conflicts} conflictsTotal={conflictsTotal} reports={reports} loading={loading} />
          <IndicatorsStrip kpis={kpis} loading={loading} />
        </Box>
      </Box>
    </DashboardLayout>
  );
}
