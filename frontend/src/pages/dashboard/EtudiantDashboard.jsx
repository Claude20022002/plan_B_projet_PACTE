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
} from '@mui/material';
import { CalendarToday, Notifications, School } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { affectationAPI, notificationAPI, etudiantAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function EtudiantDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [affectations, setAffectations] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [etudiant, setEtudiant] = useState(null);
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
                const affectationsData = await affectationAPI.getByGroupe(
                    etudiantData.id_groupe,
                    { limit: 5 }
                );
                setAffectations(affectationsData.data || []);
            }
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
                    Tableau de bord Étudiant
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Bienvenue, {user?.prenom} {user?.nom}
                </Typography>
                {etudiant && (
                    <Typography variant="body2" color="text.secondary">
                        Groupe: {etudiant.groupe?.nom_groupe || 'Non assigné'} | Niveau:{' '}
                        {etudiant.niveau}
                    </Typography>
                )}
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
                                onClick={() => navigate('/emploi-du-temps/etudiant')}
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
                                            primary={`${aff.cours?.nom_cours || 'Cours'}`}
                                            secondary={`${new Date(aff.date_seance).toLocaleDateString('fr-FR')} - ${aff.creneau?.heure_debut} - ${aff.salle?.nom_salle || 'Salle'} - ${aff.enseignant?.prenom || ''} ${aff.enseignant?.nom || ''}`}
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
                                        onClick={() => navigate('/emploi-du-temps/etudiant')}
                                    >
                                        Mon emploi du temps
                                    </Button>
                                    <Button
                                        variant="outlined"
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
    );
}

