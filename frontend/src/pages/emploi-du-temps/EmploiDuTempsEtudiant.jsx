import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Menu, MenuItem, IconButton } from '@mui/material';
import { ArrowBack, Download } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { affectationAPI, etudiantAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { exportToExcelLazy, exportToPDFLazy, exportToCSVLazy, exportToiCalLazy, exportToYAMLLazy } from '../../utils/lazyExports';
import EnhancedTimetable from '../../components/emploi-du-temps/EnhancedTimetable';

export default function EmploiDuTempsEtudiant() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [view, setView] = useState('timeGridWeek');
    const [groupeId, setGroupeId] = useState(null);
    const [affectationsData, setAffectationsData] = useState([]);
    const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

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
            // Utiliser affectationAPI pour obtenir les affectations complètes avec toutes les relations
            const response = await affectationAPI.getByGroupe(groupeId, { limit: 1000 });
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
                            onClick={() => navigate('/dashboard/etudiant')}
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
                            await exportToPDFLazy(affectationsData, `emploi-du-temps-${user?.prenom}-${user?.nom}`, `Emploi du Temps - ${user?.prenom} ${user?.nom}`, 'etudiant');
                            setExportMenuAnchor(null);
                        }}
                    >
                        Télécharger en PDF
                    </MenuItem>
                    <MenuItem
                        onClick={async () => {
                            await exportToExcelLazy(affectationsData, [], 'EmploiDuTemps', `emploi-du-temps-${user?.prenom}-${user?.nom}`);
                            setExportMenuAnchor(null);
                        }}
                    >
                        Télécharger en Excel
                    </MenuItem>
                    <MenuItem
                        onClick={async () => {
                            await exportToCSVLazy(affectationsData, `emploi-du-temps-${user?.prenom}-${user?.nom}`);
                            setExportMenuAnchor(null);
                        }}
                    >
                        Télécharger en CSV
                    </MenuItem>
                    <MenuItem
                        onClick={async () => {
                            await exportToiCalLazy(affectationsData, `emploi-du-temps-${user?.prenom}-${user?.nom}`, `Emploi du Temps - ${user?.prenom} ${user?.nom}`);
                            setExportMenuAnchor(null);
                        }}
                    >
                        Télécharger en iCal (.ics)
                    </MenuItem>
                    <MenuItem
                        onClick={async () => {
                            await exportToYAMLLazy(affectationsData, `emploi-du-temps-${user?.prenom}-${user?.nom}`, { etablissement: 'HESTIM-STENDHAL' });
                            setExportMenuAnchor(null);
                        }}
                    >
                        Télécharger en YAML (weekly_blocks)
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

