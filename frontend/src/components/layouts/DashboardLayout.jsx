import React, { useState, useEffect } from "react";
import OfflineIndicator from "../common/OfflineIndicator";
import { useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
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
    Breadcrumbs,
    Link,
} from "@mui/material";
import { NavigateNext } from "@mui/icons-material";
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
    Search,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { notificationAPI } from "../../services/api";
import GlobalSearch from "../common/GlobalSearch";

const drawerWidth = 260;

const BREADCRUMBS = {
    '/dashboard/admin':          [{ label: 'Tableau de bord', path: '/dashboard/admin' }],
    '/dashboard/enseignant':     [{ label: 'Tableau de bord', path: '/dashboard/enseignant' }],
    '/dashboard/etudiant':       [{ label: 'Tableau de bord', path: '/dashboard/etudiant' }],
    '/gestion/utilisateurs':     [{ label: 'Gestion', path: null }, { label: 'Utilisateurs', path: null }],
    '/gestion/enseignants':      [{ label: 'Gestion', path: null }, { label: 'Enseignants', path: null }],
    '/gestion/etudiants':        [{ label: 'Gestion', path: null }, { label: 'Étudiants', path: null }],
    '/gestion/filieres':         [{ label: 'Gestion', path: null }, { label: 'Filières', path: null }],
    '/gestion/groupes':          [{ label: 'Gestion', path: null }, { label: 'Groupes', path: null }],
    '/gestion/salles':           [{ label: 'Gestion', path: null }, { label: 'Salles', path: null }],
    '/gestion/cours':            [{ label: 'Gestion', path: null }, { label: 'Cours', path: null }],
    '/gestion/creneaux':         [{ label: 'Gestion', path: null }, { label: 'Créneaux', path: null }],
    '/gestion/affectations':     [{ label: 'Planning', path: null }, { label: 'Affectations', path: null }],
    '/gestion/conflits':         [{ label: 'Planning', path: null }, { label: 'Conflits', path: null }],
    '/gestion/demandes-report':  [{ label: 'Planning', path: null }, { label: 'Demandes de report', path: null }],
    '/statistiques':             [{ label: 'Statistiques', path: null }],
    '/notifications':            [{ label: 'Notifications', path: null }],
    '/parametres':               [{ label: 'Paramètres', path: null }],
    '/mes-affectations':         [{ label: 'Mes affectations', path: null }],
    '/disponibilites':           [{ label: 'Mes disponibilités', path: null }],
    '/demandes-report':          [{ label: 'Demandes de report', path: null }],
    '/emploi-du-temps/admin':    [{ label: 'Emploi du temps', path: null }, { label: 'Vue admin', path: null }],
    '/emploi-du-temps/enseignant': [{ label: 'Emploi du temps', path: null }],
    '/emploi-du-temps/etudiant': [{ label: 'Emploi du temps', path: null }],
};

function PageBreadcrumbs({ pathname }) {
    const crumbs = BREADCRUMBS[pathname];
    if (!crumbs || crumbs.length <= 1) return null;
    return (
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 1.5, fontSize: 13 }}>
            {crumbs.map((c, i) => {
                const isLast = i === crumbs.length - 1;
                return isLast ? (
                    <Typography key={i} fontSize={13} fontWeight={600} color="text.primary">
                        {c.label}
                    </Typography>
                ) : c.path ? (
                    <Link key={i} component={RouterLink} to={c.path} underline="hover" fontSize={13} color="text.secondary">
                        {c.label}
                    </Link>
                ) : (
                    <Typography key={i} fontSize={13} color="text.secondary">{c.label}</Typography>
                );
            })}
        </Breadcrumbs>
    );
}

export default function DashboardLayout({ children }) {
    const { user, logout } = useAuth();
    const { mode, toggleTheme } = useTheme();
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
        navigate("/connexion");
    };

    const loadUnreadNotifications = async () => {
        try {
            if (user?.id_user) {
                const data = await notificationAPI.getNonLues(user.id_user);
                const notifications = data.data || data || [];
                setUnreadNotifications(notifications.length);
            }
        } catch (error) {
            console.error(
                "Erreur lors du chargement des notifications:",
                error,
            );
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
            {
                text: "Tableau de bord",
                icon: <Dashboard />,
                path: `/dashboard/${user?.role}`,
                type: "item",
            },
        ];

        if (user?.role === "admin") {
            return [
                ...baseItems,
                {
                    text: "Gestion des utilisateurs",
                    icon: <AdminPanelSettings />,
                    type: "group",
                    key: "utilisateurs",
                    items: [
                        {
                            text: "Utilisateurs",
                            icon: <People />,
                            path: "/gestion/utilisateurs",
                        },
                        {
                            text: "Enseignants",
                            icon: <School />,
                            path: "/gestion/enseignants",
                        },
                        {
                            text: "Étudiants",
                            icon: <People />,
                            path: "/gestion/etudiants",
                        },
                    ],
                },
                {
                    text: "Gestion académique",
                    icon: <AccountTree />,
                    type: "group",
                    key: "academique",
                    items: [
                        {
                            text: "Filières",
                            icon: <Category />,
                            path: "/gestion/filieres",
                        },
                        {
                            text: "Groupes",
                            icon: <Groups />,
                            path: "/gestion/groupes",
                        },
                        {
                            text: "Cours",
                            icon: <Book />,
                            path: "/gestion/cours",
                        },
                        {
                            text: "Créneaux",
                            icon: <Schedule />,
                            path: "/gestion/creneaux",
                        },
                    ],
                },
                {
                    text: "Gestion des ressources",
                    icon: <Business />,
                    type: "group",
                    key: "ressources",
                    items: [
                        {
                            text: "Salles",
                            icon: <Room />,
                            path: "/gestion/salles",
                        },
                    ],
                },
                {
                    text: "Planning",
                    icon: <CalendarToday />,
                    type: "group",
                    key: "planning",
                    items: [
                        {
                            text: "Affectations",
                            icon: <Schedule />,
                            path: "/gestion/affectations",
                        },
                        {
                            text: "Emplois du temps",
                            icon: <Schedule />,
                            path: "/gestion/emplois-du-temps",
                        },
                        {
                            text: "Demandes de report",
                            icon: <Assignment />,
                            path: "/gestion/demandes-report",
                        },
                        {
                            text: "Génération automatique",
                            icon: <EventAvailable />,
                            path: "/gestion/generation-automatique",
                        },
                    ],
                },
                {
                    text: "Conflits",
                    icon: <Warning />,
                    path: "/gestion/conflits",
                    type: "item",
                },
                {
                    text: "Statistiques",
                    icon: <Dashboard />,
                    path: "/statistiques",
                    type: "item",
                },
            ];
        } else if (user?.role === "enseignant") {
            return [
                ...baseItems,
                {
                    text: "Mon emploi du temps",
                    icon: <CalendarToday />,
                    path: "/emploi-du-temps/enseignant",
                    type: "item",
                },
                {
                    text: "Mes affectations",
                    icon: <Assignment />,
                    path: "/mes-affectations",
                    type: "item",
                },
                {
                    text: "Mes disponibilités",
                    icon: <EventAvailable />,
                    path: "/disponibilites",
                    type: "item",
                },
            ];
        } else {
            return [
                ...baseItems,
                {
                    text: "Mon emploi du temps",
                    icon: <Schedule />,
                    path: "/emploi-du-temps/etudiant",
                    type: "item",
                },
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
        if (user?.role === "admin") {
            const newOpenMenus = { ...openMenus };

            menuItems.forEach((item) => {
                if (item.type === "group" && item.items) {
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
        <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Toolbar
                sx={{
                    background:
                        "linear-gradient(135deg, #001062 0%, #1a3a8f 100%)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    minHeight: "64px !important",
                }}
            >
                <Box
                    sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "8px",
                        bgcolor: "rgba(232,160,32,0.9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    <Typography
                        variant="body2"
                        fontWeight="bold"
                        color="#001062"
                        fontSize={14}
                    >
                        H
                    </Typography>
                </Box>
                <Box>
                    <Typography
                        variant="subtitle2"
                        noWrap
                        fontWeight="bold"
                        lineHeight={1.2}
                    >
                        HESTIM Planner
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{ opacity: 0.75, fontSize: 9 }}
                        noWrap
                    >
                        {user?.role === "admin"
                            ? "Administrateur"
                            : user?.role === "enseignant"
                              ? "Enseignant"
                              : "Étudiant"}
                    </Typography>
                </Box>
            </Toolbar>
            <Box
                sx={{
                    height: 3,
                    background: "linear-gradient(90deg, #e8a020, #f5c842)",
                }}
            />
            <List sx={{ flexGrow: 1, pt: 1 }}>
                {menuItems.map((item) => {
                    if (item.type === "group") {
                        const isOpen = openMenus[item.key];
                        const isSelected = isPathInGroup(
                            item.items,
                            location.pathname,
                        );
                        return (
                            <React.Fragment key={item.text}>
                                <ListItem disablePadding>
                                    <ListItemButton
                                        onClick={() =>
                                            handleMenuToggle(item.key)
                                        }
                                        selected={isSelected}
                                        sx={{
                                            mx: 1,
                                            borderRadius: 2,
                                            mb: 0.25,
                                            "&.Mui-selected": {
                                                color: "primary.main",
                                            },
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                color: isSelected
                                                    ? "primary.main"
                                                    : "text.secondary",
                                                minWidth: 36,
                                            }}
                                        >
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.text}
                                            primaryTypographyProps={{
                                                fontSize: 13,
                                                fontWeight: isSelected
                                                    ? 600
                                                    : 400,
                                            }}
                                        />
                                        {isOpen ? (
                                            <ExpandLess fontSize="small" />
                                        ) : (
                                            <ExpandMore fontSize="small" />
                                        )}
                                    </ListItemButton>
                                </ListItem>
                                <Collapse
                                    in={isOpen}
                                    timeout="auto"
                                    unmountOnExit
                                >
                                    <List component="div" disablePadding>
                                        {item.items.map((subItem) => {
                                            const isSubSel =
                                                location.pathname ===
                                                subItem.path;
                                            return (
                                                <ListItem
                                                    key={subItem.text}
                                                    disablePadding
                                                >
                                                    <ListItemButton
                                                        selected={isSubSel}
                                                        onClick={() => {
                                                            navigate(
                                                                subItem.path,
                                                            );
                                                            setMobileOpen(
                                                                false,
                                                            );
                                                        }}
                                                        sx={{
                                                            pl: 5,
                                                            mx: 1,
                                                            borderRadius: 2,
                                                            mb: 0.25,
                                                            "&.Mui-selected": {
                                                                color: "primary.main",
                                                            },
                                                        }}
                                                    >
                                                        <ListItemIcon
                                                            sx={{
                                                                color: isSubSel
                                                                    ? "primary.main"
                                                                    : "text.disabled",
                                                                minWidth: 32,
                                                            }}
                                                        >
                                                            {subItem.icon}
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={
                                                                subItem.text
                                                            }
                                                            primaryTypographyProps={{
                                                                fontSize: 12.5,
                                                                fontWeight:
                                                                    isSubSel
                                                                        ? 600
                                                                        : 400,
                                                            }}
                                                        />
                                                    </ListItemButton>
                                                </ListItem>
                                            );
                                        })}
                                    </List>
                                </Collapse>
                            </React.Fragment>
                        );
                    } else {
                        const isSel = location.pathname === item.path;
                        return (
                            <ListItem key={item.text} disablePadding>
                                <ListItemButton
                                    selected={isSel}
                                    onClick={() => {
                                        navigate(item.path);
                                        setMobileOpen(false);
                                    }}
                                    sx={{
                                        mx: 1,
                                        borderRadius: 2,
                                        mb: 0.25,
                                        "&.Mui-selected": {
                                            color: "primary.main",
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            color: isSel
                                                ? "primary.main"
                                                : "text.secondary",
                                            minWidth: 36,
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        primaryTypographyProps={{
                                            fontSize: 13,
                                            fontWeight: isSel ? 600 : 400,
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        );
                    }
                })}
            </List>

            {/* User info at bottom */}
            <Box sx={{ p: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Avatar
                        sx={{
                            width: 34,
                            height: 34,
                            bgcolor: "primary.main",
                            fontSize: 14,
                        }}
                    >
                        {user?.prenom?.[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                            {user?.prenom} {user?.nom}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            noWrap
                        >
                            {user?.email}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: "flex" }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    background:
                        "linear-gradient(90deg, #001062 0%, #1a3a8f 100%)",
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: "none" } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Box
                        component="img"
                        src="/HESTIM.png"
                        alt="HESTIM Logo"
                        sx={{
                            width: { xs: "120px", sm: "150px" },
                            height: { xs: "30px", sm: "40px" },
                            objectFit: "contain",
                            mr: 2,
                            display: { xs: "none", sm: "block" },
                            padding: "6px 10px",
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: "6px",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                        }}
                    />
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={{ flexGrow: 1 }}
                    >
                        {menuItems.find(
                            (item) => item.path === location.pathname,
                        )?.text || "HESTIM Planner"}
                    </Typography>
                    <IconButton
                        size="large"
                        edge="end"
                        aria-label="recherche"
                        color="inherit"
                        onClick={() => setSearchOpen(true)}
                        sx={{ mr: 1 }}
                    >
                        <Search />
                    </IconButton>
                    <IconButton
                        size="large"
                        edge="end"
                        aria-label="notifications"
                        color="inherit"
                        onClick={() => navigate("/notifications")}
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
                        {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
                    </IconButton>
                    <IconButton onClick={handleMenuOpen} sx={{ ml: 1 }}>
                        <Avatar
                            src={user?.avatar_url}
                            sx={{
                                width: 32,
                                height: 32,
                                bgcolor: "secondary.main",
                            }}
                        >
                            {!user?.avatar_url &&
                                user?.prenom?.[0]?.toUpperCase()}
                        </Avatar>
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem onClick={() => navigate("/parametres")}>
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
                        display: { xs: "block", sm: "none" },
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
                            width: drawerWidth,
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: "none", sm: "block" },
                        "& .MuiDrawer-paper": {
                            boxSizing: "border-box",
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
                <OfflineIndicator />
                <PageBreadcrumbs pathname={location.pathname} />
                {children}
            </Box>
            <GlobalSearch
                open={searchOpen}
                onClose={() => setSearchOpen(false)}
            />
        </Box>
    );
}
