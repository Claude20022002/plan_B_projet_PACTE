import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, Typography } from '@mui/material';
import { CheckCircleOutline, EventRepeat, ViewWeek } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { affectationAPI, demandeReportAPI, notificationAPI } from '../../services/api';
import { DepartureBoard, SessionSpotlight } from '../../design-system/board';
import ChangesList from '../../design-system/board/ChangesList';
import { byStart, findSpotlight, toBoardSession, toLocalISODate } from '../../utils/session';
import { ds } from '../../design-system/tokens';
import useLiveRefresh from '../../hooks/useLiveRefresh';

const HORIZON_DAYS = 14;

function TodoPanel({ toConfirm, pendingReports, onOpenSessions, onOpenReports }) {
  const { t } = useTranslation();
  const rows = [
    { label: t('teacher.toConfirm', { count: toConfirm }), value: toConfirm, action: onOpenSessions },
    { label: t('teacher.pendingReports', { count: pendingReports }), value: pendingReports, action: onOpenReports },
  ];
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
  const toast = useToast();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [reports, setReports] = useState([]);
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [now, setNow] = useState(() => new Date());

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
        affectationAPI.getByEnseignant(user.id_user, {
          date_from: toLocalISODate(),
          date_to: toLocalISODate(new Date(Date.now() + HORIZON_DAYS * 86400000)),
          limit: 200,
        }),
        demandeReportAPI.getByEnseignant(user.id_user).catch(() => []),
        notificationAPI.getNonLues(user.id_user).catch(() => []),
      ]);
      setSessions((affectations?.data || []).map(toBoardSession).sort(byStart));
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
  const toConfirm = upcoming.filter((s) => s.status === 'planifie').length;
  const pendingReports = reports.filter((r) => r.statut_demande === 'en_attente').length;

  const confirm = async (session) => {
    setConfirmingId(session.id);
    try {
      await affectationAPI.confirmer(session.id);
      // Mise à jour locale : le statut bascule sur le panneau sans recharger la page
      setSessions((current) => current.map((s) => (s.id === session.id ? { ...s, status: 'confirme' } : s)));
      toast.success(t('board.confirmDone'));
    } catch {
      toast.error(t('board.confirmError'));
    } finally {
      setConfirmingId(null);
    }
  };

  const spotlightActions = (s) => (
    <>
      {s.status === 'planifie' && (
        <Button
          variant="contained"
          startIcon={<CheckCircleOutline />}
          disabled={confirmingId === s.id}
          onClick={() => confirm(s)}
          // Bouton du panneau : lettres noires sur volet clair (l'orange reste réservé aux reports)
          sx={{ bgcolor: ds.board.letter, color: ds.board.ground, '&:hover': { bgcolor: '#FFFFFF' } }}
        >
          {t('board.confirm')}
        </Button>
      )}
      {s.status !== 'annule' && (
        <Button
          variant="outlined"
          startIcon={<EventRepeat />}
          onClick={() => navigate('/mes-affectations')}
          sx={{ color: ds.board.letter, borderColor: ds.board.seam }}
        >
          {t('board.requestReport')}
        </Button>
      )}
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
            renderSpotlight={(s, phase) => <SessionSpotlight session={s} phase={phase} actions={spotlightActions(s)} />}
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
            toConfirm={toConfirm}
            pendingReports={pendingReports}
            onOpenSessions={() => navigate('/mes-affectations')}
            onOpenReports={() => navigate('/demandes-report')}
          />
          <ChangesList items={changes} onSeeAll={() => navigate('/notifications')} />
        </Box>
      </Box>
    </DashboardLayout>
  );
}
