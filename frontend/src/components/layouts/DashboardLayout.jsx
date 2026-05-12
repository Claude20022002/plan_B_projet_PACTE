import React, { useEffect, useMemo, useState } from 'react';
import OfflineIndicator from '../common/OfflineIndicator';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Breadcrumbs,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme as useMuiTheme } from '@mui/material/styles';
import { motion } from 'motion/react';
import {
  AccountTree,
  AdminPanelSettings,
  Assignment,
  Book,
  Brightness4,
  Brightness7,
  Business,
  CalendarToday,
  Category,
  Dashboard,
  EventAvailable,
  ExpandLess,
  ExpandMore,
  Groups,
  Logout,
  Menu as MenuIcon,
  NavigateNext,
  Notifications,
  People,
  Room,
  Schedule,
  School,
  Search,
  Settings,
  Warning,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { notificationAPI } from '../../services/api';
import GlobalSearch from '../common/GlobalSearch';

const drawerWidth = 268;
const MotionBox = motion(Box);

const BREADCRUMBS = {
  '/dashboard/admin': [{ label: 'Tableau de bord', path: '/dashboard/admin' }],
  '/dashboard/enseignant': [{ label: 'Tableau de bord', path: '/dashboard/enseignant' }],
  '/dashboard/etudiant': [{ label: 'Tableau de bord', path: '/dashboard/etudiant' }],
  '/gestion/utilisateurs': [{ label: 'Gestion' }, { label: 'Utilisateurs' }],
  '/gestion/enseignants': [{ label: 'Gestion' }, { label: 'Enseignants' }],
  '/gestion/etudiants': [{ label: 'Gestion' }, { label: 'Étudiants' }],
  '/gestion/filieres': [{ label: 'Gestion académique' }, { label: 'Filières' }],
  '/gestion/groupes': [{ label: 'Gestion académique' }, { label: 'Groupes' }],
  '/gestion/salles': [{ label: 'Ressources' }, { label: 'Salles' }],
  '/gestion/cours': [{ label: 'Gestion académique' }, { label: 'Cours' }],
  '/gestion/creneaux': [{ label: 'Planning' }, { label: 'Créneaux' }],
  '/gestion/affectations': [{ label: 'Planning' }, { label: 'Affectations' }],
  '/gestion/conflits': [{ label: 'Planning' }, { label: 'Conflits' }],
  '/gestion/demandes-report': [{ label: 'Planning' }, { label: 'Demandes de report' }],
  '/gestion/generation-automatique': [{ label: 'Planning' }, { label: 'Génération automatique' }],
  '/statistiques': [{ label: 'Statistiques' }],
  '/notifications': [{ label: 'Notifications' }],
  '/parametres': [{ label: 'Paramètres' }],
  '/mes-affectations': [{ label: 'Mes affectations' }],
  '/disponibilites': [{ label: 'Mes disponibilités' }],
  '/demandes-report': [{ label: 'Demandes de report' }],
  '/emploi-du-temps/admin': [{ label: 'Emploi du temps' }, { label: 'Vue admin' }],
  '/emploi-du-temps/enseignant': [{ label: 'Emploi du temps' }],
  '/emploi-du-temps/etudiant': [{ label: 'Emploi du temps' }],
};

function PageBreadcrumbs({ pathname }) {
  const crumbs = BREADCRUMBS[pathname];
  if (!crumbs || crumbs.length <= 1) return null;

  return (
    <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 2 }}>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        if (isLast) {
          return (
            <Typography key={crumb.label} variant="caption" color="text.primary" fontWeight={800}>
              {crumb.label}
            </Typography>
          );
        }
        return crumb.path ? (
          <Link key={crumb.label} component={RouterLink} to={crumb.path} underline="hover" variant="caption" color="text.secondary">
            {crumb.label}
          </Link>
        ) : (
          <Typography key={crumb.label} variant="caption" color="text.secondary">
            {crumb.label}
          </Typography>
        );
      })}
    </Breadcrumbs>
  );
}

function Brand({ role }) {
  return (
    <Box sx={{ px: 2, py: 2, display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 900,
        }}
      >
        H
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h3" noWrap>
          HESTIM Planner
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {role === 'admin' ? 'Console administrateur' : role === 'enseignant' ? 'Espace enseignant' : 'Espace étudiant'}
        </Typography>
      </Box>
    </Box>
  );
}

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState({
    utilisateurs: false,
    academique: false,
    ressources: false,
    planning: false,
  });

  const menuItems = useMemo(() => {
    const baseItems = [
      {
        text: 'Tableau de bord',
        icon: <Dashboard />,
        path: `/dashboard/${user?.role}`,
        type: 'item',
      },
    ];

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        {
          text: 'Utilisateurs',
          icon: <AdminPanelSettings />,
          type: 'group',
          key: 'utilisateurs',
          items: [
            { text: 'Utilisateurs', icon: <People />, path: '/gestion/utilisateurs' },
            { text: 'Enseignants', icon: <School />, path: '/gestion/enseignants' },
            { text: 'Étudiants', icon: <People />, path: '/gestion/etudiants' },
          ],
        },
        {
          text: 'Académique',
          icon: <AccountTree />,
          type: 'group',
          key: 'academique',
          items: [
            { text: 'Filières', icon: <Category />, path: '/gestion/filieres' },
            { text: 'Groupes', icon: <Groups />, path: '/gestion/groupes' },
            { text: 'Cours', icon: <Book />, path: '/gestion/cours' },
            { text: 'Créneaux', icon: <Schedule />, path: '/gestion/creneaux' },
          ],
        },
        {
          text: 'Ressources',
          icon: <Business />,
          type: 'group',
          key: 'ressources',
          items: [{ text: 'Salles', icon: <Room />, path: '/gestion/salles' }],
        },
        {
          text: 'Planning',
          icon: <CalendarToday />,
          type: 'group',
          key: 'planning',
          items: [
            { text: 'Affectations', icon: <Schedule />, path: '/gestion/affectations' },
            { text: 'Emplois du temps', icon: <Schedule />, path: '/gestion/emplois-du-temps' },
            { text: 'Demandes de report', icon: <Assignment />, path: '/gestion/demandes-report' },
            { text: 'Génération automatique', icon: <EventAvailable />, path: '/gestion/generation-automatique' },
          ],
        },
        { text: 'Conflits', icon: <Warning />, path: '/gestion/conflits', type: 'item' },
        { text: 'Statistiques', icon: <Dashboard />, path: '/statistiques', type: 'item' },
      ];
    }

    if (user?.role === 'enseignant') {
      return [
        ...baseItems,
        { text: 'Mon emploi du temps', icon: <CalendarToday />, path: '/emploi-du-temps/enseignant', type: 'item' },
        { text: 'Mes affectations', icon: <Assignment />, path: '/mes-affectations', type: 'item' },
        { text: 'Mes disponibilités', icon: <EventAvailable />, path: '/disponibilites', type: 'item' },
      ];
    }

    return [
      ...baseItems,
      { text: 'Mon emploi du temps', icon: <Schedule />, path: '/emploi-du-temps/etudiant', type: 'item' },
    ];
  }, [user?.role]);

  const isPathInGroup = (items, currentPath) => items.some((item) => item.path === currentPath);

  useEffect(() => {
    if (!user?.id_user) return undefined;
    const loadUnreadNotifications = async () => {
      try {
        const data = await notificationAPI.getNonLues(user.id_user);
        const notifications = data.data || data || [];
        setUnreadNotifications(notifications.length);
      } catch {
        setUnreadNotifications(0);
      }
    };
    loadUnreadNotifications();
    const interval = setInterval(loadUnreadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.id_user]);

  useEffect(() => {
    const next = { ...openMenus };
    menuItems.forEach((item) => {
      if (item.type === 'group' && isPathInGroup(item.items, location.pathname)) {
        next[item.key] = true;
      }
    });
    setOpenMenus(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, menuItems]);

  const handleLogout = async () => {
    await logout();
    navigate('/connexion');
  };

  const navItemSx = (selected) => ({
    mx: 1.25,
    my: 0.25,
    borderRadius: 2,
    color: selected ? 'primary.main' : 'text.secondary',
    '& .MuiListItemIcon-root': {
      color: selected ? 'primary.main' : 'text.secondary',
    },
  });

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Brand role={user?.role} />
      <Divider />
      <List sx={{ flexGrow: 1, py: 1 }}>
        {menuItems.map((item) => {
          if (item.type === 'group') {
            const selected = isPathInGroup(item.items, location.pathname);
            const isOpen = openMenus[item.key];
            return (
              <React.Fragment key={item.text}>
                <ListItem disablePadding>
                  <ListItemButton
                    selected={selected}
                    onClick={() => setOpenMenus((prev) => ({ ...prev, [item.key]: !prev[item.key] }))}
                    sx={navItemSx(selected)}
                  >
                    <ListItemIcon sx={{ minWidth: 34 }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: 13, fontWeight: selected ? 800 : 650 }} />
                    {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                  </ListItemButton>
                </ListItem>
                <Collapse in={isOpen} timeout={180} unmountOnExit>
                  <List disablePadding>
                    {item.items.map((subItem) => {
                      const subSelected = location.pathname === subItem.path;
                      return (
                        <ListItem key={subItem.text} disablePadding>
                          <ListItemButton
                            selected={subSelected}
                            onClick={() => {
                              navigate(subItem.path);
                              setMobileOpen(false);
                            }}
                            sx={{ ...navItemSx(subSelected), pl: 4.75 }}
                          >
                            <ListItemIcon sx={{ minWidth: 30 }}>{subItem.icon}</ListItemIcon>
                            <ListItemText primary={subItem.text} primaryTypographyProps={{ fontSize: 12.5, fontWeight: subSelected ? 800 : 600 }} />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                </Collapse>
              </React.Fragment>
            );
          }

          const selected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={selected}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                sx={navItemSx(selected)}
              >
                <ListItemIcon sx={{ minWidth: 34 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: 13, fontWeight: selected ? 800 : 650 }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, p: 1, borderRadius: 2, bgcolor: 'action.hover' }}>
          <Avatar src={user?.avatar_url} sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
            {!user?.avatar_url && user?.prenom?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={800} noWrap>
              {user?.prenom} {user?.nom}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(16px)',
          color: 'text.primary',
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important', px: { xs: 2, sm: 3 } }}>
          <IconButton aria-label="open drawer" edge="start" onClick={() => setMobileOpen(true)} sx={{ mr: 1, display: { sm: 'none' } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h3" noWrap>
              {BREADCRUMBS[location.pathname]?.at(-1)?.label || 'HESTIM Planner'}
            </Typography>
            {!isMobile && (
              <Typography variant="caption" color="text.secondary" noWrap>
                Gestion académique, planning et ressources
              </Typography>
            )}
          </Box>
          <Tooltip title="Recherche globale">
            <IconButton onClick={() => setSearchOpen(true)}>
              <Search />
            </IconButton>
          </Tooltip>
          <Tooltip title="Notifications">
            <IconButton onClick={() => navigate('/notifications')}>
              <Badge badgeContent={unreadNotifications} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Changer le thème">
            <IconButton onClick={toggleTheme}>
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
          <IconButton onClick={(event) => setAnchorEl(event.currentTarget)} sx={{ ml: 0.5 }}>
            <Avatar src={user?.avatar_url} sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
              {!user?.avatar_url && user?.prenom?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { mt: 1, minWidth: 210 } }}>
            <MenuItem onClick={() => navigate('/parametres')}>
              <ListItemIcon>
                <Settings fontSize="small" />
              </ListItemIcon>
              Paramètres
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              Déconnexion
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, width: { sm: `calc(100% - ${drawerWidth}px)` }, minWidth: 0 }}>
        <Toolbar />
        <MotionBox
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 }, maxWidth: 1480, mx: 'auto' }}
        >
          <OfflineIndicator />
          <PageBreadcrumbs pathname={location.pathname} />
          {children}
        </MotionBox>
      </Box>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </Box>
  );
}

