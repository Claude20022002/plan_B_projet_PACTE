import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Menu,
    IconButton,
} from '@mui/material';
import { ArrowBack, Download } from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { affectationAPI, groupeAPI, enseignantAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { exportToExcel, exportToPDF, exportToCSV } from '../../utils/exportEmploiDuTemps';

export default function EmploiDuTempsAdmin() {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [view, setView] = useState('timeGridWeek');
    const [filterType, setFilterType] = useState('all'); // all, groupe, enseignant
    const [filterId, setFilterId] = useState('');
    const [groupes, setGroupes] = useState([]);
    const [enseignants, setEnseignants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [affectationsData, setAffectationsData] = useState([]);
    const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

    useEffect(() => {
        loadOptions();
        loadEmploiDuTemps();
    }, []);

    useEffect(() => {
        if (filterType === 'all' || (filterType !== 'all' && filterId)) {
            loadEmploiDuTemps();
        }
    }, [filterType, filterId]);

    const loadOptions = async () => {
        try {
            const [groupesData, enseignantsData] = await Promise.all([
                groupeAPI.getAll({ limit: 1000 }),
                enseignantAPI.getAll({ limit: 1000 }),
            ]);
            setGroupes(groupesData.data || []);
            setEnseignants(enseignantsData.data || []);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const loadEmploiDuTemps = async () => {
        setLoading(true);
        try {
            let data = [];
            if (filterType === 'groupe' && filterId) {
                const result = await affectationAPI.getByGroupe(Number(filterId));
                data = result.data || [];
            } else if (filterType === 'enseignant' && filterId) {
                const result = await affectationAPI.getByEnseignant(Number(filterId));
                data = result.data || [];
            } else {
                const result = await affectationAPI.getAll({ limit: 1000 });
                data = result.data || [];
            }

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
                    enseignant: `${aff.enseignant?.prenom || ''} ${aff.enseignant?.nom || ''}`,
                    statut: aff.statut,
                },
                color: aff.statut === 'confirme' ? '#4caf50' : aff.statut === 'annule' ? '#f44336' : '#ff9800',
            }));
            setEvents(formattedEvents);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            startIcon={<ArrowBack />}
                            onClick={() => navigate('/dashboard/admin')}
                            variant="outlined"
                        >
                            Retour
                        </Button>
                        <Typography variant="h5" fontWeight="bold">
                            Emplois du Temps
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Filtrer par</InputLabel>
                            <Select
                                value={filterType}
                                onChange={(e) => {
                                    setFilterType(e.target.value);
                                    setFilterId('');
                                }}
                                label="Filtrer par"
                            >
                                <MenuItem value="all">Tous</MenuItem>
                                <MenuItem value="groupe">Groupe</MenuItem>
                                <MenuItem value="enseignant">Enseignant</MenuItem>
                            </Select>
                        </FormControl>
                        {filterType === 'groupe' && (
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Groupe</InputLabel>
                                <Select
                                    value={filterId || ''}
                                    onChange={(e) => setFilterId(e.target.value)}
                                    label="Groupe"
                                >
                                    <MenuItem value="">
                                        <em>Sélectionner un groupe</em>
                                    </MenuItem>
                                    {groupes.map((groupe) => (
                                        <MenuItem key={groupe.id_groupe} value={String(groupe.id_groupe)}>
                                            {groupe.nom_groupe}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
                        {filterType === 'enseignant' && (
                            <FormControl size="small" sx={{ minWidth: 200 }}>
                                <InputLabel>Enseignant</InputLabel>
                                <Select
                                    value={filterId || ''}
                                    onChange={(e) => setFilterId(e.target.value)}
                                    label="Enseignant"
                                >
                                    <MenuItem value="">
                                        <em>Sélectionner un enseignant</em>
                                    </MenuItem>
                                    {enseignants.map((ens) => (
                                        <MenuItem key={ens.id_user} value={String(ens.id_user)}>
                                            {ens.user?.prenom} {ens.user?.nom}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}
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
                            title="Télécharger l'emploi du temps"
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
                            exportToPDF(affectationsData, 'emploi-du-temps-admin', 'Emploi du Temps - Administrateur');
                            setExportMenuAnchor(null);
                        }}
                    >
                        Télécharger en PDF
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            exportToExcel(affectationsData, 'emploi-du-temps-admin');
                            setExportMenuAnchor(null);
                        }}
                    >
                        Télécharger en Excel
                    </MenuItem>
                    <MenuItem
                        onClick={() => {
                            exportToCSV(affectationsData, 'emploi-du-temps-admin');
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

