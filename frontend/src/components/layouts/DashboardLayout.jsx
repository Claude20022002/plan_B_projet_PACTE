import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Avatar,
  Badge,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import {
  LocalLibrary,
  MenuBook,
  Campaign,
  Apartment,
  Assignment,
  AssignmentInd,
  BookOnline,
  FactCheck,
  Healing,
  Print,
  Timeline,
  Checklist,
  AutoAwesome,
  Event,
  Hub,
  Tune,
  Book,
  CalendarMonth,
  Category,
  DarkModeOutlined,
  EventRepeat,
  Groups,
  Insights,
  LightModeOutlined,
  PhonelinkLock,
  Policy,
  Logout,
  ManageAccounts,
  MeetingRoom,
  Notifications,
  People,
  PersonOutline,
  School,
  Search,
  SportsEsports,
  ViewWeek,
  WarningAmber,
  DepartureBoard as BoardIcon,
  Menu as MenuIcon,
  Quiz as QuizIcon,
} from '@mui/icons-material';
import GlobalSearch from '../common/GlobalSearch';
import SelecteurEspaces from '../espaces/SelecteurEspaces';
import Aide from '../aide/Aide';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { notificationAPI } from '../../services/api';
import { LANGUAGES } from '../../i18n';
import { ds } from '../../design-system/tokens';
import { estResponsable } from '../../utils/droits';

const RAIL_WIDTH = 248;

/** Navigation par rôle : sections (libellé) et entrées (icône, chemin, clé de traduction) */
const navigationFor = (user) => {
  const role = user?.role;
  if (role === 'admin') {
    return [
      {
        items: [
          { key: 'nav.dashboard', icon: <BoardIcon />, path: '/dashboard/admin' },
          { key: 'nav.announcements', icon: <Campaign />, path: '/annonces' },
        ],
      },
      {
        section: 'nav.planning',
        items: [
          { key: 'nav.preparation', icon: <Checklist />, path: '/gestion/preparation' },
          // Une entrée pour les trois vues des séances : grille, liste, mois (onglets dans la page)
          { key: 'nav.timetables', icon: <ViewWeek />, path: '/gestion/emplois-du-temps', aussi: ['/gestion/affectations', '/emploi-du-temps/mensuel'] },
          { key: 'nav.reports', icon: <EventRepeat />, path: '/gestion/demandes-report' },
          { key: 'nav.conflicts', icon: <WarningAmber />, path: '/gestion/conflits' },
          { key: 'nav.generation', icon: <AutoAwesome />, path: '/gestion/generation-automatique' },
          { key: 'nav.incidents', icon: <Healing />, path: '/gestion/imprevus' },
          { key: 'nav.bookings', icon: <BookOnline />, path: '/reservations' },
          { key: 'nav.exams', icon: <FactCheck />, path: '/gestion/examens' },
          { key: 'nav.myInvigilations', icon: <FactCheck />, path: '/mes-examens' },
          { key: 'nav.tracking', icon: <Timeline />, path: '/gestion/suivi' },
          { key: 'nav.attendanceReports', icon: <PhonelinkLock />, path: '/gestion/signalements-presence' },
          { key: 'nav.statistics', icon: <Insights />, path: '/statistiques' },
        ],
      },
      {
        section: 'nav.academic',
        items: [
          { key: 'nav.programs', icon: <Category />, path: '/gestion/filieres' },
          { key: 'nav.groups', icon: <Groups />, path: '/gestion/groupes' },
          { key: 'nav.courses', icon: <Book />, path: '/gestion/cours' },
          { key: 'nav.teaching', icon: <Hub />, path: '/gestion/enseignements' },
        ],
      },
      {
        section: 'nav.people',
        items: [
          { key: 'nav.users', icon: <ManageAccounts />, path: '/gestion/utilisateurs' },
          { key: 'nav.securityLog', icon: <Policy />, path: '/gestion/journal-securite' },
          { key: 'nav.teachers', icon: <School />, path: '/gestion/enseignants' },
          { key: 'nav.students', icon: <People />, path: '/gestion/etudiants' },
        ],
      },
      {
        section: 'nav.establishment',
        items: [
          { key: 'nav.calendar', icon: <Event />, path: '/gestion/calendrier' },
          { key: 'nav.campus', icon: <Apartment />, path: '/gestion/campus' },
          { key: 'nav.rooms', icon: <MeetingRoom />, path: '/gestion/salles' },
          { key: 'nav.slots', icon: <CalendarMonth />, path: '/gestion/creneaux' },
          { key: 'nav.planningSettings', icon: <Tune />, path: '/gestion/parametres-planning' },
        ],
      },
    ];
  }
  if (role === 'enseignant') {
    const sections = [
      {
        items: [
          { key: 'nav.board', icon: <BoardIcon />, path: '/dashboard/enseignant' },
          { key: 'nav.timetable', icon: <ViewWeek />, path: '/emploi-du-temps/enseignant' },
          { key: 'nav.myClasses', icon: <Groups />, path: '/mes-classes' },
          { key: 'nav.myQuizzes', icon: <QuizIcon />, path: '/studio-quiz' },
          // Services, disponibilités et demandes de report : une rubrique à trois onglets (lot E-8)
          { key: 'nav.myService', icon: <AssignmentInd />, path: '/mes-services', aussi: ['/disponibilites', '/demandes-report'] },
          // La Bibliothèque s'ouvre sur ses documents : Planner est déjà le tableau de bord
          { key: 'nav.library', icon: <LocalLibrary />, path: '/biblio/documents' },
          { key: 'nav.games', icon: <SportsEsports />, path: '/jeux' },
        ],
      },
    ];
    // Responsable de filière : préparation de ses filières
    if (estResponsable(user)) {
      sections.push({
        section: 'nav.preparation',
        items: [
          { key: 'nav.preparation', icon: <Checklist />, path: '/gestion/preparation' },
          { key: 'nav.courses', icon: <Book />, path: '/gestion/cours' },
          { key: 'nav.groups', icon: <Groups />, path: '/gestion/groupes' },
          { key: 'nav.teaching', icon: <Hub />, path: '/gestion/enseignements' },
          { key: 'nav.tracking', icon: <Timeline />, path: '/gestion/suivi' },
          { key: 'nav.monthly', icon: <Print />, path: '/emploi-du-temps/mensuel' },
        ],
      });
    }
    return sections;
  }
  return [
    {
      items: [
        { key: 'nav.board', icon: <BoardIcon />, path: '/dashboard/etudiant' },
        { key: 'nav.announcements', icon: <Campaign />, path: '/annonces' },
        { key: 'nav.timetable', icon: <ViewWeek />, path: '/emploi-du-temps/etudiant' },
        { key: 'nav.myExams', icon: <FactCheck />, path: '/mes-examens' },
        // Supports de ses classes (Planner), puis documents de toute l'école (Bibliothèque)
        { key: 'nav.myCourses', icon: <MenuBook />, path: '/mes-cours' },
        { key: 'nav.takeQuiz', icon: <QuizIcon />, path: '/quiz' },
        { key: 'nav.library', icon: <LocalLibrary />, path: '/biblio/documents' },
        { key: 'nav.games', icon: <SportsEsports />, path: '/jeux' },
      ],
    },
  ];
};

/** Onglets du bas sur téléphone (étudiant et enseignant) */
const bottomTabsFor = (role) => {
  const base = role === 'enseignant' ? 'enseignant' : 'etudiant';
  const tabs = [
    { key: 'nav.board', icon: <BoardIcon />, path: `/dashboard/${base}` },
    { key: 'nav.week', icon: <ViewWeek />, path: `/emploi-du-temps/${base}` },
  ];
  // Enseignant : ses classes (appel, devoirs, messages) ; « Mes séances » reste dans le menu
  if (role === 'enseignant') tabs.push({ key: 'nav.myClasses', icon: <Groups />, path: '/mes-classes' });
  tabs.push(
    { key: 'nav.alerts', icon: <Notifications />, path: '/notifications', badge: true },
    { key: 'nav.account', icon: <PersonOutline />, path: '/parametres' }
  );
  return tabs;
};

// Rubriques dont les sous-pages gardent le titre et l'entrée de menu active
const RUBRIQUES_PARENTES = ['/jeux', '/annonces', '/mes-classes', '/mes-cours'];

const TITLE_KEYS = {
  '/dashboard/admin': 'nav.dashboard',
  '/dashboard/enseignant': 'nav.board',
  '/dashboard/etudiant': 'nav.board',
  '/gestion/utilisateurs': 'nav.users',
  '/gestion/enseignants': 'nav.teachers',
  '/gestion/etudiants': 'nav.students',
  '/gestion/filieres': 'nav.programs',
  '/gestion/groupes': 'nav.groups',
  '/gestion/salles': 'nav.rooms',
  '/gestion/cours': 'nav.courses',
  '/gestion/creneaux': 'nav.slots',
  '/gestion/affectations': 'nav.sessions',
  '/gestion/conflits': 'nav.conflicts',
  '/gestion/demandes-report': 'nav.reports',
  '/gestion/generation-automatique': 'nav.generation',
  '/gestion/emplois-du-temps': 'nav.timetables',
  '/gestion/campus': 'nav.campus',
  '/gestion/calendrier': 'nav.calendar',
  '/gestion/parametres-planning': 'nav.planningSettings',
  '/gestion/enseignements': 'nav.teaching',
  '/statistiques': 'nav.statistics',
  '/notifications': 'nav.notifications',
  '/annonces': 'nav.announcements',
  '/parametres': 'nav.settings',
  '/mes-affectations': 'nav.mySessions',
  '/mes-classes': 'nav.myClasses',
  '/studio-quiz': 'nav.myQuizzes',
  '/quiz': 'nav.takeQuiz',
  '/mes-cours': 'nav.myCourses',
  '/mes-services': 'nav.myService',
  '/reservations': 'nav.bookings',
  '/mes-examens': 'nav.myExams',
  '/gestion/examens': 'nav.exams',
  '/gestion/imprevus': 'nav.incidents',
  '/gestion/suivi': 'nav.tracking',
  '/gestion/signalements-presence': 'nav.attendanceReports',
  '/gestion/journal-securite': 'nav.securityLog',
  '/gestion/preparation': 'nav.preparation',
  '/emploi-du-temps/mensuel': 'nav.monthly',
  '/disponibilites': 'nav.myService',
  '/demandes-report': 'nav.myService',
  '/emploi-du-temps/enseignant': 'nav.timetable',
  '/emploi-du-temps/etudiant': 'nav.timetable',
  '/jeux': 'nav.games',
  '/jeux/terminal-linux': 'nav.games',
};

function LanguageSwitch({ onDark = false }) {
  const { i18n, t } = useTranslation();
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={i18n.language}
      onChange={(_, value) => value && i18n.changeLanguage(value)}
      aria-label={t('common.language')}
      sx={{
        '& .MuiToggleButton-root': {
          fontFamily: ds.font.board,
          fontWeight: 600,
          letterSpacing: '0.08em',
          px: 1.25,
          py: 0.25,
          lineHeight: 1.6,
          color: onDark ? ds.nav.letterDim : 'text.secondary',
          borderColor: onDark ? ds.nav.bordBouton : 'divider',
          '&.Mui-selected': {
            color: onDark ? ds.nav.letter : 'primary.main',
            bgcolor: onDark ? ds.nav.boutonActif : 'action.selected',
          },
        },
      }}
    >
      {LANGUAGES.map((lang) => (
        <ToggleButton key={lang.code} value={lang.code} aria-label={lang.label}>
          {lang.short}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

export default function DashboardLayout({ children }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width:900px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  const role = user?.role;
  const navigation = useMemo(() => navigationFor(user), [user]);
  const bottomTabs = useMemo(() => bottomTabsFor(role), [role]);
  const showBottomTabs = !isDesktop && (role === 'etudiant' || role === 'enseignant');

  useEffect(() => {
    if (!user?.id_user) return undefined;
    const load = async () => {
      try {
        const data = await notificationAPI.getNonLues(user.id_user);
        const nonLues = data?.data || data || [];
        setUnread(nonLues.length);
      } catch {
        setUnread(0);
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [user?.id_user, user?.role]);

  const handleLogout = async () => {
    await logout();
    navigate('/connexion');
  };

  const go = (path) => {
    // La bibliothèque (StudyLib) est une autre application sur la même origine : navigation complète
    if (path.startsWith('/biblio')) {
      window.location.assign(path);
      return;
    }
    navigate(path);
    setDrawerOpen(false);
  };

  // Sous-pages (/jeux/devoirs/12, /annonces/3, /mes-classes/4/7…) : titre et rubrique de la page parente
  const parente = RUBRIQUES_PARENTES.find((p) => location.pathname.startsWith(`${p}/`));
  const title = t(TITLE_KEYS[location.pathname] || TITLE_KEYS[parente] || 'app.name');
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase();

  const rail = (
    <Box
      component="nav"
      aria-label={t('nav.menu')}
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: ds.nav.fond, color: ds.nav.letter }}
    >
      <Box sx={{ px: 2, pt: 2.5, pb: 2 }}>
        <Box sx={{ bgcolor: ds.white, borderRadius: `${ds.radius.md}px`, px: 1.5, py: 1, display: 'inline-flex' }}>
          <Box component="img" src="/HESTIM.png" alt="HESTIM Engineering & Business School" sx={{ height: 26, display: 'block' }} />
        </Box>
        <Box
          sx={{
            mt: 1.5,
            fontFamily: ds.font.board,
            fontWeight: 700,
            fontSize: '1.0625rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          Planner
        </Box>
        <Box sx={{ fontSize: '0.8125rem', color: ds.nav.letterDim }}>{role ? t(`roles.${role}`) : ''}</Box>
      </Box>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 1.25, pb: 2 }}>
        {navigation.map((group, index) => (
          <Box key={group.section || index} sx={{ mt: index === 0 ? 0 : 2 }}>
            {group.section && (
              <Box
                sx={{
                  px: 1.25,
                  pb: 0.5,
                  fontFamily: ds.font.board,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: ds.nav.icon,
                }}
              >
                {t(group.section)}
              </Box>
            )}
            <List disablePadding>
              {group.items.map((item) => {
                // Jeux : la rubrique reste active dans chaque jeu (/jeux/terminal-linux…)
                // Emplois du temps : aussi active sur ses vues Liste et Mois
                const selected = location.pathname === item.path || (item.aussi ?? []).includes(location.pathname) || item.path === parente;
                return (
                  <ListItemButton
                    key={item.path}
                    selected={selected}
                    aria-current={selected ? 'page' : undefined}
                    onClick={() => go(item.path)}
                    sx={{
                      my: 0.25,
                      px: 1.25,
                      color: selected ? ds.nav.letter : ds.nav.letterSoft,
                      '& .MuiListItemIcon-root': { color: selected ? ds.brand.orange : ds.nav.icon, minWidth: 34 },
                      '&.Mui-selected, &.Mui-selected:hover': { bgcolor: ds.nav.selection },
                      '&:hover': { bgcolor: ds.nav.survol },
                      '&.Mui-focusVisible': { outline: `2px solid ${ds.brand.orange}`, outlineOffset: -2 },
                    }}
                  >
                    <ListItemIcon>{item.icon}</ListItemIcon>
                    <ListItemText
                      primary={t(item.key)}
                      primaryTypographyProps={{ fontSize: '0.9375rem', fontWeight: selected ? 600 : 500 }}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Box sx={{ px: 2, py: 1.75, borderTop: `1px solid ${ds.nav.filet}` }}>
        <Box
          component="button"
          type="button"
          onClick={() => go('/parametres')}
          sx={{
            all: 'unset',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            width: '100%',
            borderRadius: `${ds.radius.sm}px`,
            '&:focus-visible': { outline: `2px solid ${ds.brand.orange}`, outlineOffset: 2 },
          }}
        >
          <Avatar src={user?.avatar_url} sx={{ width: 34, height: 34, bgcolor: ds.white, color: ds.brand.navy, fontSize: '0.875rem', fontWeight: 700 }}>
            {!user?.avatar_url && initials}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap sx={{ color: ds.nav.letter }}>
              {user?.prenom} {user?.nom}
            </Typography>
            <Typography variant="caption" noWrap sx={{ color: ds.nav.letterDim, display: 'block' }}>
              {user?.email}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LanguageSwitch onDark />
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title={mode === 'dark' ? t('common.themeLight') : t('common.themeDark')}>
            <IconButton
              onClick={toggleTheme}
              aria-label={mode === 'dark' ? t('common.themeLight') : t('common.themeDark')}
              sx={{ color: ds.nav.letterSoft }}
            >
              {mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
            </IconButton>
          </Tooltip>
          <Tooltip title={t('common.logout')}>
            <IconButton onClick={handleLogout} aria-label={t('common.logout')} sx={{ color: ds.nav.letterSoft }}>
              <Logout />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {isDesktop ? (
        <Box sx={{ width: RAIL_WIDTH, flexShrink: 0 }}>
          <Box sx={{ position: 'fixed', top: 0, bottom: 0, left: 0, width: RAIL_WIDTH }}>{rail}</Box>
        </Box>
      ) : (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: RAIL_WIDTH, bgcolor: ds.nav.fond } }}
        >
          {rail}
        </Drawer>
      )}

      <Box sx={{ flexGrow: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          sx={{
            top: 0,
            zIndex: (theme) => theme.zIndex.appBar,
            bgcolor: isDesktop ? 'background.paper' : ds.nav.fond,
            color: isDesktop ? 'text.primary' : ds.nav.letter,
            borderBottomColor: isDesktop ? 'divider' : ds.nav.fond,
          }}
        >
          <Toolbar sx={{ minHeight: { xs: 56, md: 64 }, px: { xs: 1, sm: 2, md: 3 }, gap: 0.5 }}>
            {!isDesktop && (
              <IconButton aria-label={t('nav.menu')} onClick={() => setDrawerOpen(true)} sx={{ color: 'inherit' }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography
              component="h1"
              noWrap
              sx={{
                flexGrow: 1,
                ml: isDesktop ? 0 : 0.5,
                fontFamily: ds.font.board,
                fontWeight: 700,
                fontSize: { xs: '1.125rem', md: '1.5rem' },
                letterSpacing: { xs: '0.1em', md: '0.02em' },
                textTransform: isDesktop ? 'none' : 'uppercase',
              }}
            >
              {title}
            </Typography>
            <Aide aller={go} />
            <SelecteurEspaces role={role} />
            {role === 'admin' && (
              <Tooltip title={t('nav.search')}>
                <IconButton onClick={() => setSearchOpen(true)} aria-label={t('nav.search')} sx={{ color: 'inherit' }}>
                  <Search />
                </IconButton>
              </Tooltip>
            )}
            {!showBottomTabs && (
              <Tooltip title={t('nav.notifications')}>
                <IconButton onClick={() => go('/notifications')} aria-label={t('nav.notifications')} sx={{ color: 'inherit' }}>
                  <Badge badgeContent={unread} color="secondary">
                    <Notifications />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}
          </Toolbar>
        </AppBar>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            px: { xs: 1.5, sm: 2, md: 3 },
            pt: { xs: 1.5, md: 3 },
            pb: showBottomTabs ? 'calc(72px + env(safe-area-inset-bottom))' : { xs: 2, md: 4 },
            width: '100%',
            maxWidth: 1480,
            mx: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>

      {showBottomTabs && (
        <Paper
          component="nav"
          aria-label={t('nav.menu')}
          square
          sx={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: (theme) => theme.zIndex.appBar,
            borderTop: '1px solid',
            borderColor: 'divider',
            pb: 'env(safe-area-inset-bottom)',
          }}
        >
          <BottomNavigation
            showLabels
            value={bottomTabs.findIndex((tab) => tab.path === location.pathname)}
            onChange={(_, index) => go(bottomTabs[index].path)}
            sx={{
              height: 64,
              '& .MuiBottomNavigationAction-root': { minWidth: 0, px: 0.5, color: 'text.secondary' },
              '& .MuiBottomNavigationAction-root.Mui-selected': { color: 'primary.main' },
              '& .MuiBottomNavigationAction-label': {
                fontFamily: ds.font.board,
                fontWeight: 600,
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                mt: 0.25,
              },
              '& .MuiBottomNavigationAction-label.Mui-selected': { fontSize: '0.75rem' },
            }}
          >
            {bottomTabs.map((tab) => (
              <BottomNavigationAction
                key={tab.path}
                label={t(tab.key)}
                icon={
                  tab.badge ? (
                    <Badge badgeContent={unread} color="secondary">
                      {tab.icon}
                    </Badge>
                  ) : (
                    tab.icon
                  )
                }
              />
            ))}
          </BottomNavigation>
        </Paper>
      )}

      {role === 'admin' && <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />}
    </Box>
  );
}
