import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Menu, MenuItem, IconButton } from '@mui/material';
import { ArrowBack, Download } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { affectationAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { exportToExcel, exportToPDF, exportToCSV, exportToiCal } from '../../utils/exportEmploiDuTemps';
import EnhancedTimetable from '../../components/emploi-du-temps/EnhancedTimetable';

export default function EmploiDuTempsEnseignant() {
    const { user } = useAuth();
    const navigate = useNavigate();
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
            // Utiliser affectationAPI pour obtenir les affectations complètes avec toutes les relations
            const response = await affectationAPI.getByEnseignant(user.id_user, { limit: 1000 });
            const affectations = response.data || [];
            
            // Sauvegarder les données brutes pour l'export
            setAffectationsData(affectations);
        } catch (error) {
            console.error('Erreur lors du chargement de l\'emploi du temps:', error);
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
                        onClick={async () => {
                            await exportToPDF(affectationsData, `emploi-du-temps-${user?.prenom}-${user?.nom}`, `Emploi du Temps - ${user?.prenom} ${user?.nom}`);
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
                    <MenuItem
                        onClick={() => {
                            exportToiCal(affectationsData, `emploi-du-temps-${user?.prenom}-${user?.nom}`, `Emploi du Temps - ${user?.prenom} ${user?.nom}`);
                            setExportMenuAnchor(null);
                        }}
                    >
                        Télécharger en iCal (.ics)
                    </MenuItem>
                </Menu>

                <EnhancedTimetable
                    affectations={affectationsData}
                    view={view}
                    onViewChange={setView}
                />
            </Box>
        </DashboardLayout>
    );
}

