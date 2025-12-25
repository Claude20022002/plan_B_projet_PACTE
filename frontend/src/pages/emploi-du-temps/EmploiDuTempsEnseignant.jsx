import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Select, MenuItem, FormControl, InputLabel, Button, Menu, IconButton } from '@mui/material';
import { ArrowBack, Download } from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { emploiDuTempsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { exportToExcel, exportToPDF, exportToCSV } from '../../utils/exportEmploiDuTemps';

export default function EmploiDuTempsEnseignant() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [view, setView] = useState('timeGridWeek');
    const [affectationsData, setAffectationsData] = useState([]);
    const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

    useEffect(() => {
        if (user?.id_user) {
            loadEmploiDuTemps();
        }
    }, [user]);

    const loadEmploiDuTemps = async () => {
        try {
            const data = await emploiDuTempsAPI.getByEnseignant(user.id_user);
            // Sauvegarder les données brutes pour l'export
            setAffectationsData(data);
            
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            startIcon={<ArrowBack />}
                            onClick={() => navigate('/dashboard/enseignant')}
                            variant="outlined"
                        >
                            Retour
                        </Button>
                        <Typography variant="h5" fontWeight="bold">
                            Mon Emploi du Temps
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Vue</InputLabel>
                            <Select value={view} onChange={(e) => setView(e.target.value)} label="Vue">
                                <MenuItem value="timeGridWeek">Semaine</MenuItem>
                                <MenuItem value="dayGridMonth">Mois</MenuItem>
                                <MenuItem value="timeGridDay">Jour</MenuItem>
                            </Select>
                        </FormControl>
                        <IconButton
                            color="primary"
                            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                            title="Télécharger mon emploi du temps"
                        >
                            <Download />
                        </IconButton>
                    </Box>
                </Box>

                {/* Menu d'export */}
                <Menu
                    anchorEl={exportMenuAnchor}
                    open={Boolean(exportMenuAnchor)}
                    onClose={() => setExportMenuAnchor(null)}
                >
                    <MenuItem
                        onClick={() => {
                            exportToPDF(affectationsData, `emploi-du-temps-${user?.prenom}-${user?.nom}`, `Emploi du Temps - ${user?.prenom} ${user?.nom}`);
                            setExportMenuAnchor(null);
                        }}
                    >
                        Télécharger en PDF
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            exportToExcel(affectationsData, `emploi-du-temps-${user?.prenom}-${user?.nom}`);
                            setExportMenuAnchor(null);
                        }}
                    >
                        Télécharger en Excel
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            exportToCSV(affectationsData, `emploi-du-temps-${user?.prenom}-${user?.nom}`);
                            setExportMenuAnchor(null);
                        }}
                    >
                        Télécharger en CSV
                    </MenuItem>
                </Menu>

                <Paper sx={{ p: 2 }}>
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView={view}
                        view={view}
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

