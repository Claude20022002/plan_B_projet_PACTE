import React, { useState, useMemo, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Divider,
    Grid,
    Card,
    CardContent,
    IconButton,
    Tooltip,
} from '@mui/material';
import { Info, ExpandMore, ExpandLess } from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

// Palette de couleurs vives et contrastées pour les cours (visibles en vue mois)
const COURSE_COLORS = [
    '#1976d2', // Bleu vif
    '#2e7d32', // Vert vif
    '#ed6c02', // Orange vif
    '#d32f2f', // Rouge vif
    '#9c27b0', // Violet vif
    '#0288d1', // Bleu clair
    '#388e3c', // Vert foncé
    '#f57c00', // Orange foncé
    '#c2185b', // Rose vif
    '#7b1fa2', // Violet foncé
    '#00796b', // Vert turquoise
    '#5d4037', // Marron
    '#e91e63', // Rose magenta
    '#00acc1', // Cyan
    '#8bc34a', // Vert lime
    '#ff9800', // Orange
    '#673ab7', // Violet profond
    '#009688', // Teal
];

/**
 * Génère une couleur unique pour un cours basée sur son nom
 */
const getCourseColor = (courseName, index) => {
    if (!courseName) return COURSE_COLORS[0];
    // Utiliser le hash du nom du cours pour une couleur cohérente
    let hash = 0;
    for (let i = 0; i < courseName.length; i++) {
        hash = courseName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COURSE_COLORS[Math.abs(hash) % COURSE_COLORS.length];
};

/**
 * Regroupe les affectations par jour
 */
const groupByDay = (affectations) => {
    const grouped = {};
    affectations.forEach((aff) => {
        const date = new Date(aff.date_seance).toISOString().split('T')[0];
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(aff);
    });
    return grouped;
};

export default function EnhancedTimetable({ affectations = [], view = 'timeGridWeek', onViewChange }) {
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [expandedDays, setExpandedDays] = useState({});
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [currentView, setCurrentView] = useState(() => view);

    // Mettre à jour currentView si view change de l'extérieur
    useEffect(() => {
        setCurrentView(view);
    }, [view]);

    // Grouper les affectations par jour
    const groupedByDay = useMemo(() => groupByDay(affectations), [affectations]);

    // Formater les événements pour FullCalendar
    const events = useMemo(() => {
        const courseColorMap = {};
        let colorIndex = 0;

        return affectations.map((aff, index) => {
            const courseName = aff.cours?.nom_cours || 'Cours';
            
            // Assigner une couleur cohérente au cours
            if (!courseColorMap[courseName]) {
                courseColorMap[courseName] = getCourseColor(courseName, colorIndex++);
            }

            const color = courseColorMap[courseName];
            return {
                id: aff.id_affectation,
                title: courseName,
                start: `${aff.date_seance}T${aff.creneau?.heure_debut || '09:00'}`,
                end: `${aff.date_seance}T${aff.creneau?.heure_fin || '10:45'}`,
                backgroundColor: color,
                borderColor: color,
                textColor: '#ffffff', // Texte blanc pour meilleur contraste
                classNames: ['course-event'], // Classe CSS personnalisée
                extendedProps: {
                    salle: aff.salle?.nom_salle,
                    enseignant: `${aff.enseignant?.prenom || ''} ${aff.enseignant?.nom || ''}`,
                    groupe: aff.groupe?.nom_groupe,
                    cours: aff.cours,
                    affectation: aff,
                },
            };
        });
    }, [affectations]);

    const handleEventClick = (clickInfo) => {
        const affectation = clickInfo.event.extendedProps.affectation;
        setSelectedEvent(affectation);
        setDetailDialogOpen(true);
    };

    const toggleDayExpansion = (date) => {
        setExpandedDays((prev) => ({
            ...prev,
            [date]: !prev[date],
        }));
    };

    // Vue personnalisée pour le mois (regroupement par jour)
    const renderMonthView = () => {
        const sortedDates = Object.keys(groupedByDay).sort();
        
        return (
            <Box>
                {sortedDates.map((date) => {
                    const dayAffectations = groupedByDay[date];
                    const isExpanded = expandedDays[date];
                    const displayAffectations = isExpanded ? dayAffectations : dayAffectations.slice(0, 2);
                    const hasMore = dayAffectations.length > 2;

                    // Grouper par cours (même cours = une seule entrée)
                    const coursesByDay = {};
                    dayAffectations.forEach((aff) => {
                        const courseName = aff.cours?.nom_cours || 'Cours';
                        if (!coursesByDay[courseName]) {
                            coursesByDay[courseName] = {
                                course: aff.cours,
                                affectations: [],
                                color: getCourseColor(courseName, 0),
                            };
                        }
                        coursesByDay[courseName].affectations.push(aff);
                    });

                    const dateObj = new Date(date);
                    const dayName = dateObj.toLocaleDateString('fr-FR', { weekday: 'long' });
                    const dayNumber = dateObj.getDate();
                    const monthName = dateObj.toLocaleDateString('fr-FR', { month: 'long' });

                    return (
                        <Card key={date} sx={{ mb: 2, borderLeft: `4px solid ${getCourseColor(Object.keys(coursesByDay)[0] || '', 0)}` }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="h6" fontWeight="bold">
                                        {dayName} {dayNumber} {monthName}
                                    </Typography>
                                    {hasMore && (
                                        <IconButton
                                            size="small"
                                            onClick={() => toggleDayExpansion(date)}
                                        >
                                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                                        </IconButton>
                                    )}
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    {Object.entries(coursesByDay).map(([courseName, courseData]) => {
                                        const firstAff = courseData.affectations[0];
                                        const times = courseData.affectations
                                            .map((a) => `${a.creneau?.heure_debut || ''}-${a.creneau?.heure_fin || ''}`)
                                            .join(', ');

                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={courseName}>
                                                <Paper
                                                    sx={{
                                                        p: 2,
                                                        bgcolor: `${courseData.color}15`,
                                                        borderLeft: `4px solid ${courseData.color}`,
                                                        cursor: 'pointer',
                                                        '&:hover': {
                                                            bgcolor: `${courseData.color}25`,
                                                        },
                                                    }}
                                                    onClick={() => {
                                                        setSelectedEvent(firstAff);
                                                        setDetailDialogOpen(true);
                                                    }}
                                                >
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                        <Chip
                                                            label={courseName}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: courseData.color,
                                                                color: 'white',
                                                                fontWeight: 'bold',
                                                            }}
                                                        />
                                                        <Tooltip title="Voir les détails">
                                                            <IconButton
                                                                size="small"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedEvent(firstAff);
                                                                    setDetailDialogOpen(true);
                                                                }}
                                                            >
                                                                <Info fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                    <Typography component="div" variant="body2" color="text.secondary">
                                                        {times}
                                                    </Typography>
                                                    <Typography variant="caption" display="block" color="text.secondary">
                                                        Salle: {firstAff.salle?.nom_salle || 'N/A'}
                                                    </Typography>
                                                    <Typography variant="caption" display="block" color="text.secondary">
                                                        Prof: {firstAff.enseignant?.prenom || ''} {firstAff.enseignant?.nom || ''}
                                                    </Typography>
                                                    {courseData.affectations.length > 1 && (
                                                        <Typography variant="caption" color="primary" display="block" sx={{ mt: 0.5 }}>
                                                            {courseData.affectations.length} séance(s)
                                                        </Typography>
                                                    )}
                                                </Paper>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </CardContent>
                        </Card>
                    );
                })}
            </Box>
        );
    };

    return (
        <>
            <Paper sx={{ p: 2 }}>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={currentView}
                    view={currentView}
                    events={events}
                    eventClick={handleEventClick}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay',
                    }}
                    locale="fr"
                    height="auto"
                    slotMinTime="08:00:00"
                    slotMaxTime="18:00:00"
                    dayMaxEvents={3}
                    moreLinkClick="popover"
                    eventDisplay="block"
                    eventTextColor="#ffffff"
                    datesSet={(dateInfo) => {
                        // Mettre à jour la vue si elle change
                        if (dateInfo.view.type !== currentView) {
                            setCurrentView(dateInfo.view.type);
                            if (onViewChange) {
                                onViewChange(dateInfo.view.type);
                            }
                        }
                    }}
                    eventContent={(eventInfo) => {
                        if (currentView === 'dayGridMonth') {
                            // Vue mois : afficher le nom du cours avec meilleure visibilité
                            return (
                                <Box 
                                    component="div" 
                                    sx={{ 
                                        p: 0.5,
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)', // Légère transparence blanche pour contraste
                                        borderRadius: '2px',
                                    }}
                                >
                                    <Typography 
                                        component="span" 
                                        variant="caption" 
                                        fontWeight="bold" 
                                        sx={{ 
                                            color: '#ffffff',
                                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)', // Ombre pour meilleure lisibilité
                                            fontSize: '0.75rem',
                                            lineHeight: 1.2,
                                            textAlign: 'center',
                                        }}
                                    >
                                        {eventInfo.event.title}
                                    </Typography>
                                </Box>
                            );
                        }
                        // Vue semaine/jour : afficher plus de détails
                        return (
                            <Box component="div" sx={{ p: 0.5 }}>
                                <Typography component="span" variant="body2" fontWeight="bold" sx={{ color: 'white', mb: 0.5, display: 'block', textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)' }}>
                                    {eventInfo.event.title}
                                </Typography>
                                <Typography component="span" variant="caption" sx={{ color: 'white', opacity: 0.95, display: 'block', textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)' }}>
                                    {eventInfo.event.extendedProps.salle}
                                </Typography>
                                <Typography component="span" variant="caption" sx={{ color: 'white', opacity: 0.9, display: 'block', textShadow: '0 1px 1px rgba(0, 0, 0, 0.5)' }}>
                                    {eventInfo.event.extendedProps.enseignant}
                                </Typography>
                            </Box>
                        );
                    }}
                />
            </Paper>

            {/* Dialog de détails */}
            <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} maxWidth="sm" fullWidth>
                {selectedEvent && (
                    <>
                        <DialogTitle>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box
                                    sx={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%',
                                        bgcolor: getCourseColor(selectedEvent.cours?.nom_cours || '', 0),
                                    }}
                                />
                                <Typography variant="h6">{selectedEvent.cours?.nom_cours || 'Cours'}</Typography>
                            </Box>
                        </DialogTitle>
                        <DialogContent dividers>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Date et heure
                                    </Typography>
                                    <Typography variant="body1">
                                        {new Date(selectedEvent.date_seance).toLocaleDateString('fr-FR', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {selectedEvent.creneau?.heure_debut} - {selectedEvent.creneau?.heure_fin}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Salle
                                    </Typography>
                                    <Typography variant="body1">{selectedEvent.salle?.nom_salle || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Enseignant
                                    </Typography>
                                    <Typography variant="body1">
                                        {selectedEvent.enseignant?.prenom || ''} {selectedEvent.enseignant?.nom || ''}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Groupe
                                    </Typography>
                                    <Typography variant="body1">{selectedEvent.groupe?.nom_groupe || 'N/A'}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Statut
                                    </Typography>
                                    <Chip
                                        label={selectedEvent.statut || 'planifie'}
                                        size="small"
                                        color={
                                            selectedEvent.statut === 'confirme'
                                                ? 'success'
                                                : selectedEvent.statut === 'annule'
                                                ? 'error'
                                                : 'default'
                                        }
                                    />
                                </Grid>
                                {selectedEvent.cours?.code_cours && (
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Code cours
                                        </Typography>
                                        <Typography variant="body1">{selectedEvent.cours.code_cours}</Typography>
                                    </Grid>
                                )}
                            </Grid>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDetailDialogOpen(false)}>Fermer</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </>
    );
}
