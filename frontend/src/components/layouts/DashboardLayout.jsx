import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Badge,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { Notifications, Search, Menu as MenuIcon } from '@mui/icons-material';
import GlobalSearch from '../common/GlobalSearch';
import SelecteurEspaces from '../espaces/SelecteurEspaces';
import Aide from '../aide/Aide';
import LienEvitement, { ID_CONTENU } from './LienEvitement';
import OngletsDuBas from './OngletsDuBas';
import PiedDuMenu from './PiedDuMenu';
import { RUBRIQUES_PARENTES, bottomTabsFor, cleDuTitre, navigationFor } from './navigation';
import { useAuth } from '../../contexts/AuthContext';
import { notificationAPI } from '../../services/api';
import { ds } from '../../design-system/tokens';
import useTitreOnglet from '../../hooks/useTitreOnglet';

const RAIL_WIDTH = 248;

export default function DashboardLayout({ children }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
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
  const title = t(cleDuTitre(location.pathname));
  useTitreOnglet(title);

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
                // Un <li> autour de chaque bouton : une liste ne contient que des éléments de liste (M-13)
                return (
                  <ListItem key={item.path} disablePadding>
                    <ListItemButton
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
                  </ListItem>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      <PiedDuMenu aller={go} onLogout={handleLogout} />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <LienEvitement />
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
          id={ID_CONTENU}
          tabIndex={-1}
          sx={{
            outline: 'none',
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

      {showBottomTabs && <OngletsDuBas onglets={bottomTabs} nonLues={unread} aller={go} />}

      {role === 'admin' && <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />}
    </Box>
  );
}
