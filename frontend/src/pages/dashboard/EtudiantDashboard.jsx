import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    Button,
    Paper,
    List,
    ListItem,
    ListItemText,
    Avatar,
    Chip,
    Divider,
    LinearProgress,
} from '@mui/material';
import {
    CalendarToday,
    Notifications,
    School,
    Event,
    AccessTime,
    LocationOn,
    Person,
    Book,
    ArrowBack,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { affectationAPI, notificationAPI, etudiantAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function EtudiantDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [affectations, setAffectations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [etudiant, setEtudiant] = useState(null);
    const [stats, setStats] = useState({ totalCours: 0, coursAujourdhui: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id_user) {
            loadDashboardData();
        }
    }, [user]);

    const loadDashboardData = async () => {
        try {
            const [etudiantData, notifsData] = await Promise.all([
                etudiantAPI.getById(user.id_user),
                notificationAPI.getNonLues(user.id_user),
            ]);

            setEtudiant(etudiantData);
            setNotifications(notifsData.data || []);

            if (etudiantData?.id_groupe) {
                const affectationsData = await affectationAPI.getByGroupe(etudiantData.id_groupe, { limit: 10 });
                const affs = affectationsData.data || [];
                setAffectations(affs);

                // Calculer les statistiques
                const aujourdhui = new Date().toDateString();
                const coursAujourdhui = affs.filter(
                    (aff) => new Date(aff.date_seance).toDateString() === aujourdhui
                ).length;

                setStats({
                    totalCours: affs.length,
                    coursAujourdhui,
                });
            }
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { label: 'Mon emploi du temps', path: '/emploi-du-temps/etudiant', icon: <CalendarToday />, variant: 'contained' },
    ];

    const statCards = [
        {
            title: 'Total cours',
            value: stats.totalCours,
            icon: <Book />,
            color: '#1976d2',
        },
        {
            title: 'Cours aujourd\'hui',
            value: stats.coursAujourdhui,
            icon: <Event />,
            color: '#388e3c',
        },
        {
            title: 'Notifications',
            value: notifications.length,
            icon: <Notifications />,
            color: '#f57c00',
        },
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
                                Tableau de bord Étudiant
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Bienvenue, {user?.prenom} {user?.nom} • {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </Typography>
                            {etudiant && (
                                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                    <Chip
                                        label={`Groupe: ${etudiant.groupe?.nom_groupe || 'Non assigné'}`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                    <Chip
                                        label={`Niveau: ${etudiant.niveau}`}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                    />
                                </Box>
                            )}
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
                                    transition: 'all 0.3s ease',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    '&:hover': {
                                        transform: 'translateY(-8px)',
                                        boxShadow: 6,
                                        borderColor: card.color,
                                    },
                                }}
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

                <Grid container spacing={3}>
                    {/* Mes prochains cours */}
                    <Grid item xs={12} md={8}>
                        <Paper
                            elevation={2}
                            sx={{
                                p: 3,
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
                                    Mes prochains cours
                                </Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => navigate('/emploi-du-temps/etudiant')}
                                >
                                    Voir tout
                                </Button>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            {affectations.length > 0 ? (
                                <List sx={{ p: 0 }}>
                                    {affectations.slice(0, 5).map((aff, index) => (
                                        <React.Fragment key={aff.id_affectation}>
                                            <ListItem
                                                sx={{
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 2,
                                                    mb: 2,
                                                    bgcolor: 'background.paper',
                                                    '&:hover': {
                                                        bgcolor: 'action.hover',
                                                        borderColor: 'primary.main',
                                                    },
                                                }}
                                            >
                                                <Avatar
                                                    sx={{
                                                        bgcolor: 'primary.main',
                                                        mr: 2,
                                                    }}
                                                >
                                                    <Book />
                                                </Avatar>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                                            {aff.cours?.nom_cours || 'Cours'}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Person fontSize="small" color="action" />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {aff.enseignant?.prenom || ''} {aff.enseignant?.nom || 'Enseignant'}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <CalendarToday fontSize="small" color="action" />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {new Date(aff.date_seance).toLocaleDateString('fr-FR', {
                                                                        weekday: 'long',
                                                                        year: 'numeric',
                                                                        month: 'long',
                                                                        day: 'numeric',
                                                                    })}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <AccessTime fontSize="small" color="action" />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {aff.creneau?.heure_debut} - {aff.creneau?.heure_fin}
                                                                </Typography>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <LocationOn fontSize="small" color="action" />
                                                                <Typography variant="body2" color="text.secondary">
                                                                    Salle: {aff.salle?.nom_salle || 'N/A'}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                            {index < affectations.slice(0, 5).length - 1 && <Divider />}
                                        </React.Fragment>
                                    ))}
                                </List>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Book sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        Aucun cours programmé
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* Notifications et actions */}
                    <Grid item xs={12} md={4}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Paper
                                    elevation={2}
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="h6" fontWeight="bold">
                                            Notifications
                                        </Typography>
                                        {notifications.length > 0 && (
                                            <Chip
                                                label={notifications.length}
                                                color="primary"
                                                size="small"
                                            />
                                        )}
                                    </Box>
                                    <Divider sx={{ mb: 2 }} />
                                    {notifications.length > 0 ? (
                                        <List sx={{ p: 0 }}>
                                            {notifications.slice(0, 3).map((notif) => (
                                                <ListItem
                                                    key={notif.id_notification}
                                                    sx={{
                                                        bgcolor: 'action.hover',
                                                        borderRadius: 1,
                                                        mb: 1,
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={
                                                            <Typography variant="subtitle2" fontWeight="bold">
                                                                {notif.titre}
                                                            </Typography>
                                                        }
                                                        secondary={
                                                            <Typography variant="caption" color="text.secondary">
                                                                {notif.message}
                                                            </Typography>
                                                        }
                                                    />
                                                </ListItem>
                                            ))}
                                        </List>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                                            Aucune notification
                                        </Typography>
                                    )}
                                    <Button
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        onClick={() => navigate('/notifications')}
                                        sx={{ mt: 2 }}
                                    >
                                        Voir toutes les notifications
                                    </Button>
                                </Paper>
                            </Grid>

                            <Grid item xs={12}>
                                <Paper
                                    elevation={2}
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                    }}
                                >
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                        Actions rapides
                                    </Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Button
                                            variant="outlined"
                                            fullWidth
                                            startIcon={<School />}
                                            onClick={() => navigate('/salles/disponibles')}
                                        >
                                            Salles disponibles
                                        </Button>
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </DashboardLayout>
    );
}
