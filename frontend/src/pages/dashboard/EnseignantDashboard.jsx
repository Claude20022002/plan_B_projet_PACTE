import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Typography, useMediaQuery } from '@mui/material';
import { EventRepeat, FactCheck, ViewWeek } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { affectationAPI, demandeReportAPI, notificationAPI } from '../../services/api';
import { fetchAll } from '../../utils/fetchAll';
import { DepartureBoard, SessionSpotlight } from '../../design-system/board';
import ChangesList from '../../design-system/board/ChangesList';
import { byStart, findSpotlight, toBoardSession, toLocalISODate } from '../../utils/session';
import { ds } from '../../design-system/tokens';
import useLiveRefresh from '../../hooks/useLiveRefresh';

const HORIZON_DAYS = 14;

function TodoPanel({ pendingReports, onOpenReports }) {
  const { t } = useTranslation();
  // Une séance planifiée est tenue pour confirmée : l'enseignant n'agit que pour demander un report
  const rows = [{ label: t('teacher.pendingReports', { count: pendingReports }), value: pendingReports, action: onOpenReports }];
  return (
    <Box
      component="section"
      aria-labelledby="todo-title"
      sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: `${ds.radius.lg}px` }}
    >
      <Typography
        id="todo-title"
        component="h2"
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          fontFamily: ds.font.board,
          fontWeight: 700,
          fontSize: '1rem',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}
      >
        {t('admin.toHandle')}
      </Typography>
      {rows.map((row) => (
        <Box
          key={row.label}
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', '&:last-of-type': { borderBottom: 0 } }}
        >
          <Box
            component="span"
            sx={{
              minWidth: 40,
              fontFamily: ds.font.board,
              fontWeight: 700,
              fontSize: '1.75rem',
              lineHeight: 1,
              color: row.value > 0 ? 'text.primary' : 'text.secondary',
            }}
          >
            {row.value}
          </Box>
          <Typography sx={{ flexGrow: 1, fontSize: '0.9375rem' }}>{row.label}</Typography>
          <Button size="small" onClick={row.action}>
            {t('common.seeAll')}
          </Button>
        </Box>
      ))}
    </Box>
  );
}

export default function EnseignantDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [reports, setReports] = useState([]);
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const compact = useMediaQuery('(max-width:599.95px)');

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!user?.id_user) return;
    if (!silent) setLoading(true);
    setError(false);
    try {
      const [affectations, demandes, notifications] = await Promise.all([
        // Toutes les pages de l'horizon : le serveur en rend au plus 100 séances à la fois
        fetchAll((p) => affectationAPI.getByEnseignant(user.id_user, p), {
          date_from: toLocalISODate(),
          date_to: toLocalISODate(new Date(Date.now() + HORIZON_DAYS * 86400000)),
        }),
        demandeReportAPI.getByEnseignant(user.id_user).catch(() => []),
        notificationAPI.getNonLues(user.id_user).catch(() => []),
      ]);
      // Planifiée = confirmée pour l'enseignant (aucune confirmation à donner, sauf demande de report)
      setSessions(
        (affectations || [])
          .map(toBoardSession)
          .map((s) => (s.status === 'planifie' ? { ...s, status: 'confirme' } : s))
          .sort(byStart)
      );
      setReports(demandes?.data || demandes || []);
      setChanges((notifications?.data || notifications || []).slice(0, 5));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user?.id_user]);

  useEffect(() => {
    load();
  }, [load]);
  useLiveRefresh(() => load({ silent: true }));

  const upcoming = useMemo(() => sessions.filter((s) => !s.end || s.end > now), [sessions, now]);
  // Le Tableau montre aujourd'hui et le prochain jour de cours ; la semaine est dans l'onglet Semaine
  const boardSessions = useMemo(() => {
    const days = [...new Set(upcoming.map((s) => s.date))].slice(0, 2);
    return upcoming.filter((s) => days.includes(s.date));
  }, [upcoming]);
  const spotlight = useMemo(() => findSpotlight(boardSessions, now), [boardSessions, now]);
  const pendingReports = reports.filter((r) => r.statut_demande === 'en_attente').length;

  // Une seule ligne d'actions sous la séance (retours du 21 octobre) : l'appel, le jour même, en
  // action principale, puis le report. Les classes et les quiz ont leur entrée dans le menu
  // (Mes classes, Activités) : un quiz ne dépend pas d'une séance.
  const spotlightActions = (s) =>
    s.status === 'annule' ? null : (
      <>
        {s.date === toLocalISODate() && (
          <Button
            variant="contained"
            disableElevation
            startIcon={<FactCheck />}
            onClick={() => navigate(`/appel/${s.id}`)}
            sx={{ bgcolor: ds.board.letter, color: ds.board.ground, '&:hover': { bgcolor: ds.board.letterDim } }}
          >
            {t('classes.page.appel.a_faire')}
          </Button>
        )}
        <Button
          variant="outlined"
          startIcon={<EventRepeat />}
          onClick={() => navigate(`/demandes-report?seance=${s.id}`)}
          sx={{ color: ds.board.letter, borderColor: ds.board.seam }}
        >
          {t('board.requestReport')}
        </Button>
      </>
    );

  return (
    <DashboardLayout>
      <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(280px, 1fr)' } }}>
        <Box sx={{ minWidth: 0 }}>
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
          <DepartureBoard
            title={t('board.titleTeacher')}
            sessions={boardSessions}
            loading={loading}
            spotlight={spotlight}
            columns={['time', 'course', 'group', 'room', 'status']}
            renderSpotlight={(s, phase) => (
              <>
                <SessionSpotlight session={s} phase={phase} actions={spotlightActions(s)} />
                {/* Téléphone : les changements juste sous la prochaine séance */}
                {compact && changes.length > 0 && (
                  <ChangesList items={changes} variant="board" onSeeAll={() => navigate('/notifications')} />
                )}
              </>
            )}
            empty={
              <Box sx={{ color: ds.board.letter, maxWidth: 520 }}>
                <Typography component="p" sx={{ fontFamily: ds.font.board, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '1.125rem' }}>
                  {t('board.noSessionsTitle')}
                </Typography>
                <Typography component="p" sx={{ mt: 1, color: ds.board.letterDim }}>
                  {t('board.noSessionsBody')}
                </Typography>
              </Box>
            }
          />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" startIcon={<ViewWeek />} onClick={() => navigate('/emploi-du-temps/enseignant')}>
              {t('board.openTimetable')}
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gap: 2, alignContent: 'start' }}>
          <TodoPanel
            pendingReports={pendingReports}
            onOpenReports={() => navigate('/demandes-report')}
          />
          {!(compact && changes.length > 0 && spotlight) && (
            <ChangesList items={changes} onSeeAll={() => navigate('/notifications')} />
          )}
        </Box>
      </Box>
    </DashboardLayout>
  );
}
