import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { emploiDuTempsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function EmploiDuTempsEnseignant() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [view, setView] = useState('timeGridWeek');

    useEffect(() => {
        if (user?.id_user) {
            loadEmploiDuTemps();
        }
    }, [user]);

    const loadEmploiDuTemps = async () => {
        try {
            const data = await emploiDuTempsAPI.getByEnseignant(user.id_user);
            const formattedEvents = data.map((aff) => ({
                id: aff.id_affectation,
                title: `${aff.cours?.nom_cours || 'Cours'} - ${aff.groupe?.nom_groupe || ''}`,
                start: `${aff.date_seance}T${aff.creneau?.heure_debut || '08:00'}`,
                end: `${aff.date_seance}T${aff.creneau?.heure_fin || '10:00'}`,
                extendedProps: {
                    salle: aff.salle?.nom_salle,
                    groupe: aff.groupe?.nom_groupe,
                    statut: aff.statut,
                },
                color: aff.statut === 'confirme' ? '#4caf50' : '#ff9800',
            }));
            setEvents(formattedEvents);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    return (
        <DashboardLayout>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Mon Emploi du Temps
                    </Typography>
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
                            </Box>
                        )}
                    />
                </Paper>
            </Box>
        </DashboardLayout>
    );
}

