import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
} from '@mui/material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { affectationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function MesAffectations() {
    const { user } = useAuth();
    const [affectations, setAffectations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id_user) {
            loadAffectations();
        }
    }, [user]);

    const loadAffectations = async () => {
        try {
            const data = await affectationAPI.getByEnseignant(user.id_user);
            setAffectations(data.data || []);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Mes Affectations
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Liste de tous les cours qui vous ont été assignés avec leurs détails (groupe, salle, date, créneau horaire).
                    Ces affectations apparaissent également dans votre emploi du temps.
                </Typography>

                {loading ? (
                    <Typography>Chargement...</Typography>
                ) : affectations.length === 0 ? (
                    <Paper sx={{ p: 3, mt: 2 }}>
                        <Typography variant="body1" color="text.secondary" align="center">
                            Aucune affectation
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Cours</TableCell>
                                    <TableCell>Groupe</TableCell>
                                    <TableCell>Salle</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Créneau</TableCell>
                                    <TableCell>Statut</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {affectations.map((aff) => (
                                    <TableRow key={aff.id_affectation}>
                                        <TableCell>{aff.cours?.nom_cours || '-'}</TableCell>
                                        <TableCell>{aff.groupe?.nom_groupe || '-'}</TableCell>
                                        <TableCell>{aff.salle?.nom_salle || '-'}</TableCell>
                                        <TableCell>
                                            {new Date(aff.date_seance).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                        <TableCell>
                                            {aff.creneau?.heure_debut} - {aff.creneau?.heure_fin}
                                        </TableCell>
                                        <TableCell>
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
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </DashboardLayout>
    );
}

