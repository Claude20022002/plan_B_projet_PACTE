import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Select, MenuItem, FormControl, InputLabel, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { emploiDuTempsAPI, etudiantAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function EmploiDuTempsEtudiant() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [view, setView] = useState('timeGridWeek');
    const [groupeId, setGroupeId] = useState(null);

    useEffect(() => {
        if (user?.id_user) {
            loadGroupe();
        }
    }, [user]);

    useEffect(() => {
        if (groupeId) {
            loadEmploiDuTemps();
        }
    }, [groupeId]);

    const loadGroupe = async () => {
        try {
            const etudiant = await etudiantAPI.getById(user.id_user);
            if (etudiant?.id_groupe) {
                setGroupeId(etudiant.id_groupe);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const loadEmploiDuTemps = async () => {
        try {
            const data = await emploiDuTempsAPI.getByGroupe(groupeId);
            const formattedEvents = data.map((aff) => ({
                id: aff.id_affectation,
                title: `${aff.cours?.nom_cours || 'Cours'}`,
                start: `${aff.date_seance}T${aff.creneau?.heure_debut || '08:00'}`,
                end: `${aff.date_seance}T${aff.creneau?.heure_fin || '10:00'}`,
                extendedProps: {
                    salle: aff.salle?.nom_salle,
                    enseignant: `${aff.enseignant?.prenom || ''} ${aff.enseignant?.nom || ''}`,
                },
                color: '#1976d2',
            }));
            setEvents(formattedEvents);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    return (
        <DashboardLayout>
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            startIcon={<ArrowBack />}
                            onClick={() => navigate('/dashboard/etudiant')}
                            variant="outlined"
                        >
                            Retour
                        </Button>
                        <Typography variant="h5" fontWeight="bold">
                            Mon Emploi du Temps
                        </Typography>
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Vue</InputLabel>
                        <Select value={view} onChange={(e) => setView(e.target.value)} label="Vue">
                            <MenuItem value="timeGridWeek">Semaine</MenuItem>
                            <MenuItem value="dayGridMonth">Mois</MenuItem>
                            <MenuItem value="timeGridDay">Jour</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Paper sx={{ p: 2 }}>
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView={view}
                        events={events}
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,timeGridDay',
                        }}
                        locale="fr"
                        height="auto"
                        eventContent={(eventInfo) => (
                            <Box>
                                <Typography variant="body2" fontWeight="bold">
                                    {eventInfo.event.title}
                                </Typography>
                                <Typography variant="caption" display="block">
                                    {eventInfo.event.extendedProps.salle}
                                </Typography>
                                <Typography variant="caption" display="block">
                                    {eventInfo.event.extendedProps.enseignant}
                                </Typography>
                            </Box>
                        )}
                    />
                </Paper>
            </Box>
        </DashboardLayout>
    );
}

