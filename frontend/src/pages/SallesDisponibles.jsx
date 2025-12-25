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
    TextField,
    Chip,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { salleAPI } from '../services/api';

export default function SallesDisponibles() {
    const [salles, setSalles] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSallesDisponibles();
    }, []);

    const loadSallesDisponibles = async () => {
        try {
            const data = await salleAPI.getDisponibles();
            setSalles(data.data || data || []);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSalles = salles.filter(
        (salle) =>
            salle.nom_salle?.toLowerCase().includes(search.toLowerCase()) ||
            salle.batiment?.toLowerCase().includes(search.toLowerCase()) ||
            salle.type_salle?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Salles Disponibles
                </Typography>

                <Paper sx={{ mb: 2, mt: 2 }}>
                    <Box sx={{ p: 2 }}>
                        <TextField
                            fullWidth
                            placeholder="Rechercher une salle..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                            }}
                        />
                    </Box>
                </Paper>

                {loading ? (
                    <Typography>Chargement...</Typography>
                ) : filteredSalles.length === 0 ? (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="body1" color="text.secondary" align="center">
                            Aucune salle disponible
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Nom</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell>Capacité</TableCell>
                                    <TableCell>Bâtiment</TableCell>
                                    <TableCell>Étage</TableCell>
                                    <TableCell>Statut</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredSalles.map((salle) => (
                                    <TableRow key={salle.id_salle}>
                                        <TableCell>{salle.nom_salle}</TableCell>
                                        <TableCell>{salle.type_salle}</TableCell>
                                        <TableCell>{salle.capacite}</TableCell>
                                        <TableCell>{salle.batiment}</TableCell>
                                        <TableCell>{salle.etage || '-'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={salle.disponible ? 'Disponible' : 'Indisponible'}
                                                color={salle.disponible ? 'success' : 'default'}
                                                size="small"
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

