import React, { useState, useEffect } from 'react';
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
    Badge,
    Collapse,
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
    CalendarToday,
    Assignment,
    EventAvailable,
    ExpandLess,
    ExpandMore,
    AdminPanelSettings,
    AccountTree,
    Business,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { notificationAPI } from '../../services/api';

const drawerWidth = 260;

export default function DashboardLayout({ children }) {
    const { user, logout } = useAuth();
    const { mode, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [openMenus, setOpenMenus] = useState({
        utilisateurs: false,
        academique: false,
        ressources: false,
        planning: false,
    });

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

    const loadUnreadNotifications = async () => {
        try {
            if (user?.id_user) {
                const data = await notificationAPI.getNonLues(user.id_user);
                const notifications = data.data || data || [];
                setUnreadNotifications(notifications.length);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des notifications:', error);
        }
    };

    const handleMenuToggle = (menu) => {
        setOpenMenus((prev) => ({
            ...prev,
            [menu]: !prev[menu],
        }));
    };

    // Menu items selon le rôle
    const getMenuItems = () => {
        const baseItems = [
            { text: 'Tableau de bord', icon: <Dashboard />, path: `/dashboard/${user?.role}`, type: 'item' },
        ];

        if (user?.role === 'admin') {
            return [
                ...baseItems,
                {
                    text: 'Gestion des utilisateurs',
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
                    text: 'Gestion académique',
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
                    text: 'Gestion des ressources',
                    icon: <Business />,
                    type: 'group',
                    key: 'ressources',
                    items: [
                        { text: 'Salles', icon: <Room />, path: '/gestion/salles' },
                    ],
                },
                {
                    text: 'Planning',
                    icon: <CalendarToday />,
                    type: 'group',
                    key: 'planning',
                    items: [
                        { text: 'Affectations', icon: <Schedule />, path: '/gestion/affectations' },
                        { text: 'Emplois du temps', icon: <Schedule />, path: '/gestion/emplois-du-temps' },
                    ],
                },
                { text: 'Conflits', icon: <Warning />, path: '/gestion/conflits', type: 'item' },
                { text: 'Statistiques', icon: <Dashboard />, path: '/statistiques', type: 'item' },
            ];
        } else if (user?.role === 'enseignant') {
            return [
                ...baseItems,
                { text: 'Mon emploi du temps', icon: <CalendarToday />, path: '/emploi-du-temps/enseignant', type: 'item' },
                { text: 'Mes affectations', icon: <Assignment />, path: '/mes-affectations', type: 'item' },
                { text: 'Mes disponibilités', icon: <EventAvailable />, path: '/disponibilites', type: 'item' },
            ];
        } else {
            return [
                ...baseItems,
                { text: 'Mon emploi du temps', icon: <Schedule />, path: '/emploi-du-temps/etudiant', type: 'item' },
            ];
        }
    };

    const menuItems = getMenuItems();

    const isPathInGroup = (groupItems, currentPath) => {
        return groupItems.some((item) => item.path === currentPath);
    };

    // Charger les notifications non lues
    useEffect(() => {
        if (user?.id_user) {
            loadUnreadNotifications();
            // Rafraîchir toutes les 30 secondes
            const interval = setInterval(loadUnreadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Ouvrir automatiquement les menus contenant la page actuelle
    useEffect(() => {
        if (user?.role === 'admin') {
            const newOpenMenus = { ...openMenus };
            
            menuItems.forEach((item) => {
                if (item.type === 'group' && item.items) {
                    if (isPathInGroup(item.items, location.pathname)) {
                        newOpenMenus[item.key] = true;
                    }
                }
            });
            
            setOpenMenus(newOpenMenus);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, user]);

    const drawer = (
        <Box>
            <Toolbar
                sx={{
                    bgcolor: '#001962', // Bleu HESTIM
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                }}
            >
                <Typography variant="h6" noWrap component="div" fontWeight="bold">
                    Table de bord
                </Typography>
            </Toolbar>
            <Divider />
            <List>
                {menuItems.map((item) => {
                    if (item.type === 'group') {
                        const isOpen = openMenus[item.key];
                        const isSelected = isPathInGroup(item.items, location.pathname);
                        
                        return (
                            <React.Fragment key={item.text}>
                                <ListItem disablePadding>
                                    <ListItemButton
                                        onClick={() => handleMenuToggle(item.key)}
                                        selected={isSelected}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                color: isSelected ? '#001962' : 'inherit',
                                            }}
                                        >
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText primary={item.text} />
                                        {isOpen ? <ExpandLess /> : <ExpandMore />}
                                    </ListItemButton>
                                </ListItem>
                                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                    <List component="div" disablePadding>
                                        {item.items.map((subItem) => (
                                            <ListItem key={subItem.text} disablePadding>
                                                <ListItemButton
                                                    selected={location.pathname === subItem.path}
                                                    onClick={() => {
                                                        navigate(subItem.path);
                                                        setMobileOpen(false);
                                                    }}
                                                    sx={{ pl: 4 }}
                                                >
                                                    <ListItemIcon
                                                        sx={{
                                                            color: location.pathname === subItem.path ? '#001962' : 'inherit',
                                                        }}
                                                    >
                                                        {subItem.icon}
                                                    </ListItemIcon>
                                                    <ListItemText primary={subItem.text} />
                                                </ListItemButton>
                                            </ListItem>
                                        ))}
                                    </List>
                                </Collapse>
                            </React.Fragment>
                        );
                    } else {
                        return (
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
                                            color: location.pathname === item.path ? '#001962' : 'inherit',
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} />
                                </ListItemButton>
                            </ListItem>
                        );
                    }
                })}
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
                    <Box
                        component="img"
                        src="/HESTIM.png"
                        alt="HESTIM Logo"
                        sx={{
                            width: { xs: '120px', sm: '150px' },
                            height: { xs: '30px', sm: '40px' },
                            objectFit: 'contain',
                            mr: 2,
                            display: { xs: 'none', sm: 'block' },
                        }}
                    />
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
                        <Badge badgeContent={unreadNotifications} color="error">
                            <Notifications />
                        </Badge>
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

