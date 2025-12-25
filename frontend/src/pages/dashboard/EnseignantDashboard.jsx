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
    Chip,
} from '@mui/material';
import {
    Schedule,
    Notifications,
    Assignment,
    CalendarToday,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { affectationAPI, notificationAPI, demandeReportAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function EnseignantDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [affectations, setAffectations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [demandes, setDemandes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id_user) {
            loadDashboardData();
        }
    }, [user]);

    const loadDashboardData = async () => {
        try {
            const [affectationsData, notifsData, demandesData] = await Promise.all([
                affectationAPI.getByEnseignant(user.id_user, { limit: 5 }),
                notificationAPI.getNonLues(user.id_user),
                demandeReportAPI.getByEnseignant(user.id_user),
            ]);

            setAffectations(affectationsData.data || []);
            setNotifications(notifsData.data || []);
            setDemandes(demandesData || []);
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ flexGrow: 1, p: 3, bgcolor: '#f5f6fb', minHeight: '100vh' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Tableau de bord Enseignant
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Bienvenue, {user?.prenom} {user?.nom}
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Mes prochains cours */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                mb: 2,
                            }}
                        >
                            <Typography variant="h6" fontWeight="bold">
                                Mes prochains cours
                            </Typography>
                            <Button
                                size="small"
                                onClick={() => navigate('/emploi-du-temps/enseignant')}
                            >
                                Voir tout
                            </Button>
                        </Box>
                        {affectations.length > 0 ? (
                            <List>
                                {affectations.map((aff) => (
                                    <ListItem
                                        key={aff.id_affectation}
                                        sx={{
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 1,
                                            mb: 1,
                                        }}
                                    >
                                        <ListItemText
                                            primary={`${aff.cours?.nom_cours || 'Cours'} - ${aff.groupe?.nom_groupe || 'Groupe'}`}
                                            secondary={`${new Date(aff.date_seance).toLocaleDateString('fr-FR')} - ${aff.creneau?.heure_debut} - ${aff.salle?.nom_salle || 'Salle'}`}
                                        />
                                        <Chip
                                            label={aff.statut}
                                            size="small"
                                            color={
                                                aff.statut === 'confirme'
                                                    ? 'success'
                                                    : aff.statut === 'annule'
                                                      ? 'error'
                                                      : 'default'
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography variant="body2" color="text.secondary" align="center">
                                Aucun cours programmé
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                {/* Notifications et actions */}
                <Grid item xs={12} md={4}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Notifications
                                </Typography>
                                {notifications.length > 0 ? (
                                    <List>
                                        {notifications.slice(0, 3).map((notif) => (
                                            <ListItem key={notif.id_notification}>
                                                <ListItemText
                                                    primary={notif.titre}
                                                    secondary={notif.message}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Aucune notification
                                    </Typography>
                                )}
                            </Paper>
                        </Grid>

                        <Grid item xs={12}>
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    Actions rapides
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Button
                                        variant="contained"
                                        startIcon={<CalendarToday />}
                                        onClick={() => navigate('/emploi-du-temps/enseignant')}
                                    >
                                        Mon emploi du temps
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Assignment />}
                                        onClick={() => navigate('/demandes-report')}
                                    >
                                        Demander un report
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Schedule />}
                                        onClick={() => navigate('/disponibilites')}
                                    >
                                        Gérer mes disponibilités
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}

