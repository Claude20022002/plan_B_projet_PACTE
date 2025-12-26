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
    BarChart as BarChartIcon,
    CalendarToday,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { statistiquesAPI, notificationAPI, conflitAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

            // Extraire les statistiques de la réponse
            const statsResume = statsData?.resume || statsData || {};
            console.log('Statistiques reçues:', statsResume);
            
            setStats(statsResume);
            setNotifications(notifsData.data || notifsData || []);
            setConflits(conflitsData.data || conflitsData || []);
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
            // Initialiser avec des valeurs par défaut en cas d'erreur
            setStats({
                total_users: 0,
                total_admins: 0,
                total_affectations: 0,
                total_salles: 0,
                salles_utilisees: 0,
                total_enseignants: 0,
                enseignants_actifs: 0,
                total_groupes: 0,
                total_cours: 0,
                total_heures: 0,
            });
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
        { label: 'Statistiques', path: '/statistiques', icon: <BarChartIcon />, variant: 'outlined' },
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

                {/* Section 1: Répartition des utilisateurs */}
                <Box sx={{ mt: 4, mb: 4 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                        Répartition des Utilisateurs
                    </Typography>
                    <Paper 
                        elevation={3} 
                        sx={{ 
                            p: 4, 
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                            Distribution par rôle
                        </Typography>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                                <LinearProgress sx={{ width: '100%' }} />
                            </Box>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={[
                                        { name: 'Enseignants', value: Number(stats?.total_enseignants) || 0 },
                                        { name: 'Étudiants', value: Math.max(0, (Number(stats?.total_users) || 0) - (Number(stats?.total_enseignants) || 0) - (Number(stats?.total_admins) || 0)) },
                                        { name: 'Administrateurs', value: Number(stats?.total_admins) || 0 },
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip 
                                            formatter={(value) => [value, 'Nombre']}
                                            labelFormatter={(label) => `Rôle: ${label}`}
                                        />
                                        <Legend />
                                        <Bar dataKey="value" fill="#7c4dff" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                                {/* Afficher les valeurs numériques */}
                                <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                                    <Chip 
                                        label={`Enseignants: ${stats?.total_enseignants || 0}`} 
                                        color="success" 
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Étudiants: ${Math.max(0, (stats?.total_users || 0) - (stats?.total_enseignants || 0) - (stats?.total_admins || 0))}`} 
                                        color="info" 
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Administrateurs: ${stats?.total_admins || 0}`} 
                                        color="primary" 
                                        variant="outlined"
                                    />
                                </Box>
                            </>
                        )}
                    </Paper>
                </Box>

                {/* Section 2: Vue d'ensemble */}
                <Box sx={{ mt: 4, mb: 4 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                        Vue d'Ensemble
                    </Typography>
                    <Paper 
                        elevation={3} 
                        sx={{ 
                            p: 4, 
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                            Répartition des ressources
                        </Typography>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                                <LinearProgress sx={{ width: '100%' }} />
                            </Box>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={350}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Affectations', value: Number(stats?.total_affectations) || 0 },
                                                { name: 'Cours', value: Number(stats?.total_cours) || 0 },
                                                { name: 'Salles', value: Number(stats?.total_salles) || 0 },
                                                { name: 'Groupes', value: Number(stats?.total_groupes) || 0 },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent, value }) => 
                                                value > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                                            }
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {[
                                                { name: 'Affectations', value: Number(stats?.total_affectations) || 0 },
                                                { name: 'Cours', value: Number(stats?.total_cours) || 0 },
                                                { name: 'Salles', value: Number(stats?.total_salles) || 0 },
                                                { name: 'Groupes', value: Number(stats?.total_groupes) || 0 },
                                            ].map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#7c4dff', '#1976d2', '#f57c00', '#388e3c'][index]} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value) => [value, 'Valeur']}
                                            labelFormatter={(label) => `Ressource: ${label}`}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Afficher les valeurs numériques */}
                                <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                                    <Chip 
                                        label={`Affectations: ${stats?.total_affectations || 0}`} 
                                        sx={{ bgcolor: '#7c4dff15', color: '#7c4dff' }}
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Cours: ${stats?.total_cours || 0}`} 
                                        sx={{ bgcolor: '#1976d215', color: '#1976d2' }}
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Salles: ${stats?.total_salles || 0}`} 
                                        sx={{ bgcolor: '#f57c0015', color: '#f57c00' }}
                                        variant="outlined"
                                    />
                                    <Chip 
                                        label={`Groupes: ${stats?.total_groupes || 0}`} 
                                        sx={{ bgcolor: '#388e3c15', color: '#388e3c' }}
                                        variant="outlined"
                                    />
                                </Box>
                            </>
                        )}
                    </Paper>
                </Box>

                {/* Section 3: Statistiques globales */}
                <Box sx={{ mt: 4, mb: 4 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3, color: 'primary.main' }}>
                        Statistiques Globales
                    </Typography>
                    <Paper 
                        elevation={3} 
                        sx={{ 
                            p: 4, 
                            borderRadius: 2,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                            Comparaison des principales métriques
                        </Typography>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 350 }}>
                                <LinearProgress sx={{ width: '100%' }} />
                            </Box>
                        ) : (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart
                                    data={[
                                        { name: 'Utilisateurs', value: Number(stats?.total_users) || 0 },
                                        { name: 'Enseignants', value: Number(stats?.total_enseignants) || 0 },
                                        { name: 'Salles', value: Number(stats?.total_salles) || 0 },
                                        { name: 'Cours', value: Number(stats?.total_cours) || 0 },
                                        { name: 'Affectations', value: Number(stats?.total_affectations) || 0 },
                                        { name: 'Groupes', value: Number(stats?.total_groupes) || 0 },
                                        { name: 'Admins', value: Number(stats?.total_admins) || 0 },
                                    ]}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="name" 
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis />
                                    <Tooltip 
                                        formatter={(value) => [value, 'Valeur']}
                                        labelFormatter={(label) => `Métrique: ${label}`}
                                    />
                                    <Legend />
                                    <Bar dataKey="value" fill="#7c4dff" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                        {/* Afficher les valeurs numériques sous le graphique */}
                        {!loading && stats && (
                            <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                                <Chip 
                                    label={`Utilisateurs: ${stats?.total_users || 0}`} 
                                    color="primary" 
                                    variant="outlined"
                                />
                                <Chip 
                                    label={`Enseignants: ${stats?.total_enseignants || 0}`} 
                                    color="success" 
                                    variant="outlined"
                                />
                                <Chip 
                                    label={`Salles: ${stats?.total_salles || 0}`} 
                                    color="warning" 
                                    variant="outlined"
                                />
                                <Chip 
                                    label={`Cours: ${stats?.total_cours || 0}`} 
                                    color="secondary" 
                                    variant="outlined"
                                />
                                <Chip 
                                    label={`Affectations: ${stats?.total_affectations || 0}`} 
                                    color="info" 
                                    variant="outlined"
                                />
                                <Chip 
                                    label={`Groupes: ${stats?.total_groupes || 0}`} 
                                    color="success" 
                                    variant="outlined"
                                />
                                <Chip 
                                    label={`Admins: ${stats?.total_admins || 0}`} 
                                    color="primary" 
                                    variant="outlined"
                                />
                            </Box>
                        )}
                    </Paper>
                </Box>
            </Box>
        </DashboardLayout>
    );
}
