import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Alert, Box, Button, useMediaQuery } from '@mui/material';
import { ViewWeek } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { etudiantAPI, notificationAPI } from '../../services/api';
import { ChangementsCarte, ListeSeancesCarte, MessageVide, ProchaineSeanceCarte } from '../../design-system/cartes';
import { byStart, findSpotlight, toBoardSession } from '../../utils/session';
import { chargerMesSeances } from '../../utils/mesSeances';
import useLiveRefresh from '../../hooks/useLiveRefresh';

const HORIZON_DAYS = 7;

export default function EtudiantDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const compact = useMediaQuery('(max-width:599.95px)');

  // La séance « en cours / prochaine » se recalcule chaque minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!user?.id_user) return;
    if (!silent) setLoading(true);
    setError(false);
    try {
      const [etudiant, notifications] = await Promise.all([
        etudiantAPI.getById(user.id_user),
        notificationAPI.getNonLues(user.id_user).catch(() => []),
      ]);
      setChanges((notifications?.data || notifications || []).slice(0, 5));

      const idGroupe = etudiant?.id_groupe;
      setGroup(etudiant?.groupe || null);
      if (!idGroupe) {
        setSessions([]);
        return;
      }

      // Séances du groupe ET des groupes parents (CM de la promotion), comme sur le mobile
      const { seances } = await chargerMesSeances(new Date(), new Date(Date.now() + HORIZON_DAYS * 86400000));
      setSessions(seances.map(toBoardSession).sort(byStart));
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

  // Seules les séances pas encore terminées restent au panneau
  const upcoming = useMemo(() => sessions.filter((s) => !s.end || s.end > now), [sessions, now]);
  // Le Tableau répond à « aujourd'hui et le prochain jour de cours » ; la semaine est dans l'onglet Semaine
  const boardSessions = useMemo(() => {
    const days = [...new Set(upcoming.map((s) => s.date))].slice(0, 2);
    return upcoming.filter((s) => days.includes(s.date));
  }, [upcoming]);
  const spotlight = useMemo(() => findSpotlight(boardSessions, now), [boardSessions, now]);

  const boardTitle = group?.nom_groupe ? `${t('board.title')} · ${group.nom_groupe}` : t('board.title');

  return (
    <DashboardLayout>
      <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(280px, 1fr)' } }}>
        <Box sx={{ minWidth: 0, display: 'grid', gap: { xs: 2, md: 3 }, alignContent: 'start' }}>
          {error && (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={() => load()}>
                  {t('common.retry')}
                </Button>
              }
            >
              {t('common.errorLoad')}
            </Alert>
          )}
          {!loading && spotlight && <ProchaineSeanceCarte session={spotlight.session} phase={spotlight.phase} />}
          {/* Téléphone : « qu'est-ce qui a changé ? » juste sous la prochaine séance */}
          {compact && changes.length > 0 && <ChangementsCarte items={changes} onSeeAll={() => navigate('/notifications')} />}
          <ListeSeancesCarte
            title={boardTitle}
            sessions={boardSessions}
            loading={loading}
            spotlight={spotlight}
            columns={['time', 'course', 'room', 'teacher', 'status']}
            empty={<MessageVide titre={t('board.noSessionsTitle')} texte={t('board.noSessionsBody')} />}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="outlined" startIcon={<ViewWeek />} onClick={() => navigate('/emploi-du-temps/etudiant')}>
              {t('board.openTimetable')}
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gap: { xs: 2, md: 3 }, alignContent: 'start', minWidth: 0 }}>
          {!(compact && changes.length > 0) && <ChangementsCarte items={changes} onSeeAll={() => navigate('/notifications')} />}
        </Box>
      </Box>
    </DashboardLayout>
  );
}
