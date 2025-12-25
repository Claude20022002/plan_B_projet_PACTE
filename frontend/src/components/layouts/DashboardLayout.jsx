import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    Typography,
    Divider,
    IconButton,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Avatar,
    Menu,
    MenuItem,
} from '@mui/material';
import {
    Menu as MenuIcon,
    Dashboard,
    People,
    School,
    Room,
    Book,
    Schedule,
    Warning,
    Notifications,
    Settings,
    Logout,
    Groups,
    Category,
    Brightness4,
    Brightness7,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const drawerWidth = 260;

export default function DashboardLayout({ children }) {
    const { user, logout } = useAuth();
    const { mode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/connexion');
    };

    // Menu items selon le rôle
    const getMenuItems = () => {
        const baseItems = [
            { text: 'Tableau de bord', icon: <Dashboard />, path: `/dashboard/${user?.role}` },
        ];

        if (user?.role === 'admin') {
            return [
                ...baseItems,
                { text: 'Utilisateurs', icon: <People />, path: '/gestion/utilisateurs' },
                { text: 'Enseignants', icon: <School />, path: '/gestion/enseignants' },
                { text: 'Étudiants', icon: <People />, path: '/gestion/etudiants' },
                { text: 'Filières', icon: <Category />, path: '/gestion/filieres' },
                { text: 'Groupes', icon: <Groups />, path: '/gestion/groupes' },
                { text: 'Salles', icon: <Room />, path: '/gestion/salles' },
                { text: 'Cours', icon: <Book />, path: '/gestion/cours' },
                { text: 'Créneaux', icon: <Schedule />, path: '/gestion/creneaux' },
                { text: 'Affectations', icon: <Schedule />, path: '/gestion/affectations' },
                { text: 'Conflits', icon: <Warning />, path: '/gestion/conflits' },
                { text: 'Emplois du temps', icon: <Schedule />, path: '/gestion/emplois-du-temps' },
                { text: 'Statistiques', icon: <Dashboard />, path: '/statistiques' },
            ];
        } else if (user?.role === 'enseignant') {
            return [
                ...baseItems,
                { text: 'Mon emploi du temps', icon: <Schedule />, path: '/emploi-du-temps/enseignant' },
                { text: 'Mes affectations', icon: <Schedule />, path: '/mes-affectations' },
                { text: 'Demandes de report', icon: <Schedule />, path: '/demandes-report' },
                { text: 'Mes disponibilités', icon: <Schedule />, path: '/disponibilites' },
            ];
        } else {
            return [
                ...baseItems,
                { text: 'Mon emploi du temps', icon: <Schedule />, path: '/emploi-du-temps/etudiant' },
            ];
        }
    };

    const menuItems = getMenuItems();

    const drawer = (
        <Box>
            <Toolbar
                sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <Typography variant="h6" noWrap component="div" fontWeight="bold">
                    HESTIM Planner
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.text} disablePadding>
                        <ListItemButton
                            selected={location.pathname === item.path}
                            onClick={() => {
                                navigate(item.path);
                                setMobileOpen(false);
                            }}
                        >
                            <ListItemIcon
                                sx={{
                                    color: location.pathname === item.path ? 'primary.main' : 'inherit',
                                }}
                            >
                                {item.icon}
                            </ListItemIcon>
                            <ListItemText primary={item.text} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                        {menuItems.find((item) => item.path === location.pathname)?.text ||
                            'HESTIM Planner'}
                    </Typography>
                    <IconButton
                        size="large"
                        edge="end"
                        aria-label="notifications"
                        color="inherit"
                        onClick={() => navigate('/notifications')}
                    >
                        <Notifications />
                    </IconButton>
                    <IconButton
                        size="large"
                        edge="end"
                        aria-label="changer le thème"
                        color="inherit"
                        onClick={toggleTheme}
                        sx={{ ml: 1 }}
                    >
                        {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
                    </IconButton>
                    <IconButton onClick={handleMenuOpen} sx={{ ml: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                            {user?.prenom?.[0]?.toUpperCase()}
                        </Avatar>
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
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
            <Box
                component="nav"
                sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{
                        keepMounted: true,
                    }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                        },
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
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                }}
            >
                <Toolbar />
                {children}
            </Box>
        </Box>
    );
}

