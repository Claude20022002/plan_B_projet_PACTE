import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Paper,
    Avatar,
    Chip,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Divider,
    LinearProgress,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People,
    School,
    Room,
    Book,
    Schedule,
    Warning,
    Notifications,
    TrendingUp,
    Add,
    Settings,
    BarChart,
    CalendarToday,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { statistiquesAPI, notificationAPI, conflitAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [conflits, setConflits] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [statsData, notifsData, conflitsData] = await Promise.all([
                statistiquesAPI.getStatistiquesGlobales(),
                notificationAPI.getNonLues(user?.id_user),
                conflitAPI.getNonResolus(),
            ]);

            setStats(statsData.resume || statsData);
            setNotifications(notifsData.data || notifsData || []);
            setConflits(conflitsData.data || conflitsData || []);
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Utilisateurs',
            value: stats?.total_users || 0,
            icon: <People />,
            color: '#1976d2',
            path: '/gestion/utilisateurs',
        },
        {
            title: 'Enseignants',
            value: stats?.total_enseignants || 0,
            icon: <School />,
            color: '#388e3c',
            path: '/gestion/enseignants',
        },
        {
            title: 'Salles',
            value: stats?.total_salles || 0,
            icon: <Room />,
            color: '#f57c00',
            path: '/gestion/salles',
        },
        {
            title: 'Cours',
            value: stats?.total_cours || 0,
            icon: <Book />,
            color: '#7b1fa2',
            path: '/gestion/cours',
        },
        {
            title: 'Affectations',
            value: stats?.total_affectations || 0,
            icon: <Schedule />,
            color: '#0288d1',
            path: '/gestion/affectations',
        },
        {
            title: 'Conflits',
            value: conflits.length,
            icon: <Warning />,
            color: '#d32f2f',
            path: '/gestion/conflits',
        },
    ];

    const quickActions = [
        { label: 'Créer une affectation', path: '/gestion/affectations?nouvelle=true', icon: <Add />, variant: 'contained' },
        { label: 'Emplois du temps', path: '/gestion/emplois-du-temps', icon: <CalendarToday />, variant: 'outlined' },
        { label: 'Statistiques', path: '/statistiques', icon: <BarChart />, variant: 'outlined' },
    ];

    return (
        <DashboardLayout>
            <Box sx={{ flexGrow: 1, bgcolor: 'background.default', minHeight: '100vh' }}>
                {/* Barre d'actions rapides en haut */}
                <Paper
                    elevation={2}
                    sx={{
                        p: 2,
                        mb: 3,
                        bgcolor: 'background.paper',
                        borderRadius: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                                Tableau de bord Administrateur
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Bienvenue, {user?.prenom} {user?.nom} • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {quickActions.map((action, index) => (
                                <Button
                                    key={index}
                                    variant={action.variant}
                                    startIcon={action.icon}
                                    onClick={() => navigate(action.path)}
                                    size="small"
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </Box>
                    </Box>
                </Paper>

                {loading && <LinearProgress sx={{ mb: 2 }} />}

                {/* Statistiques */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    {statCards.map((card, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card
                                sx={{
                                    height: '100%',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: 6,
                                        borderColor: card.color,
                                    },
                                }}
                                onClick={() => navigate(card.path)}
                            >
                                <CardContent>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h3" fontWeight="bold" sx={{ color: card.color, mb: 1 }}>
                                                {card.value}
                                            </Typography>
                                            <Typography variant="body1" color="text.secondary" fontWeight="medium">
                                                {card.title}
                                            </Typography>
                                        </Box>
                                        <Avatar
                                            sx={{
                                                bgcolor: `${card.color}15`,
                                                color: card.color,
                                                width: 64,
                                                height: 64,
                                            }}
                                        >
                                            {card.icon}
                                        </Avatar>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {/* Contenu principal */}
                <Grid container spacing={3}>
                    {/* Notifications */}
                    <Grid item xs={12} md={6}>
                        <Paper
                            elevation={2}
                            sx={{
                                p: 3,
                                height: '100%',
                                borderRadius: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    mb: 3,
                                }}
                            >
                                <Typography variant="h6" fontWeight="bold">
                                    Notifications récentes
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {notifications.length > 0 && (
                                        <Chip
                                            label={notifications.length}
                                            color="primary"
                                            size="small"
                                        />
                                    )}
                                    <IconButton
                                        size="small"
                                        onClick={() => navigate('/notifications')}
                                        color="primary"
                                    >
                                        <Notifications />
                                    </IconButton>
                                </Box>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {notifications.length > 0 ? (
                                <List sx={{ p: 0 }}>
                                    {notifications.slice(0, 5).map((notif, index) => (
                                        <React.Fragment key={notif.id_notification}>
                                            <ListItem
                                                sx={{
                                                    bgcolor: 'action.hover',
                                                    borderRadius: 1,
                                                    mb: 1,
                                                    '&:hover': { bgcolor: 'action.selected' },
                                                }}
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Typography variant="subtitle2" fontWeight="bold">
                                                                {notif.titre}
                                                            </Typography>
                                                            <Chip
                                                                label={notif.type_notification}
                                                                size="small"
                                                                color={
                                                                    notif.type_notification === 'error'
                                                                        ? 'error'
                                                                        : notif.type_notification === 'warning'
                                                                          ? 'warning'
                                                                          : 'primary'
                                                                }
                                                            />
                                                        </Box>
                                                    }
                                                    secondary={
                                                        <>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {notif.message}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {new Date(notif.date_creation).toLocaleString('fr-FR')}
                                                            </Typography>
                                                        </>
                                                    }
                                                />
                                            </ListItem>
                                            {index < notifications.slice(0, 5).length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Notifications sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Aucune notification
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* Conflits non résolus */}
                    <Grid item xs={12} md={6}>
                        <Paper
                            elevation={2}
                            sx={{
                                p: 3,
                                height: '100%',
                                borderRadius: 2,
                            }}
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    mb: 3,
                                }}
                            >
                                <Typography variant="h6" fontWeight="bold">
                                    Conflits non résolus
                                </Typography>
                                <Chip
                                    label={conflits.length}
                                    color="error"
                                    size="medium"
                                    icon={<Warning />}
                                />
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {conflits.length > 0 ? (
                                <List sx={{ p: 0 }}>
                                    {conflits.slice(0, 5).map((conflit, index) => (
                                        <React.Fragment key={conflit.id_conflit}>
                                            <ListItem
                                                sx={{
                                                    bgcolor: 'error.light',
                                                    borderRadius: 1,
                                                    mb: 1,
                                                    '&:hover': { bgcolor: 'error.main', color: 'white' },
                                                }}
                                            >
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="subtitle2" fontWeight="bold">
                                                            {conflit.type_conflit}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Typography variant="body2">
                                                            {conflit.description}
                                                        </Typography>
                                                    }
                                                />
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="error"
                                                    onClick={() => navigate(`/gestion/conflits`)}
                                                    sx={{ ml: 2 }}
                                                >
                                                    Résoudre
                                                </Button>
                                            </ListItem>
                                            {index < conflits.slice(0, 5).length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Warning sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Aucun conflit à résoudre
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </DashboardLayout>
    );
}
