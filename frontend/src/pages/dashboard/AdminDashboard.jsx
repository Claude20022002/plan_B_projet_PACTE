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
} from '@mui/icons-material';
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

            setStats(statsData);
            setNotifications(notifsData.data || []);
            setConflits(conflitsData.data || []);
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

    return (
        <Box sx={{ flexGrow: 1, p: 3, bgcolor: '#f5f6fb', minHeight: '100vh' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Tableau de bord Administrateur
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Bienvenue, {user?.prenom} {user?.nom}
                </Typography>
            </Box>

            {/* Statistiques */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {statCards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card
                            sx={{
                                height: '100%',
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 4,
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
                                    <Box>
                                        <Typography
                                            variant="h4"
                                            fontWeight="bold"
                                            sx={{ color: card.color }}
                                        >
                                            {card.value}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {card.title}
                                        </Typography>
                                    </Box>
                                    <Avatar
                                        sx={{
                                            bgcolor: `${card.color}20`,
                                            color: card.color,
                                            width: 56,
                                            height: 56,
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
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 2,
                            }}
                        >
                            <Typography variant="h6" fontWeight="bold">
                                Notifications récentes
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={() => navigate('/notifications')}
                            >
                                <Notifications />
                            </IconButton>
                        </Box>
                        {notifications.length > 0 ? (
                            <List>
                                {notifications.slice(0, 5).map((notif) => (
                                    <ListItem key={notif.id_notification}>
                                        <ListItemText
                                            primary={notif.titre}
                                            secondary={notif.message}
                                        />
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
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="text.secondary" align="center">
                                Aucune notification
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                {/* Conflits non résolus */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 2,
                            }}
                        >
                            <Typography variant="h6" fontWeight="bold">
                                Conflits non résolus
                            </Typography>
                            <Chip
                                label={conflits.length}
                                color="error"
                                size="small"
                            />
                        </Box>
                        {conflits.length > 0 ? (
                            <List>
                                {conflits.slice(0, 5).map((conflit) => (
                                    <ListItem key={conflit.id_conflit}>
                                        <ListItemText
                                            primary={conflit.type_conflit}
                                            secondary={conflit.description}
                                        />
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() =>
                                                navigate(`/gestion/conflits/${conflit.id_conflit}`)
                                            }
                                        >
                                            Résoudre
                                        </Button>
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="text.secondary" align="center">
                                Aucun conflit
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                {/* Actions rapides */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                            Actions rapides
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                            <Button
                                variant="contained"
                                onClick={() => navigate('/gestion/affectations/nouvelle')}
                            >
                                Créer une affectation
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/gestion/salles/nouvelle')}
                            >
                                Ajouter une salle
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/gestion/cours/nouveau')}
                            >
                                Ajouter un cours
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => navigate('/gestion/utilisateurs/nouveau')}
                            >
                                Créer un utilisateur
                            </Button>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}

