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
    TablePagination,
    Button,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Alert,
} from '@mui/material';
import { CheckCircle, Cancel, Visibility, ArrowBack } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { conflitAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function Conflits() {
    const navigate = useNavigate();
    const [conflits, setConflits] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [open, setOpen] = useState(false);
    const [selectedConflit, setSelectedConflit] = useState(null);
    const [filter, setFilter] = useState('all'); // all, non-resolus, resolus

    useEffect(() => {
        loadConflits();
    }, [page, rowsPerPage, filter]);

    const loadConflits = async () => {
        try {
            let data;
            if (filter === 'non-resolus') {
                data = await conflitAPI.getNonResolus({
                    page: page + 1,
                    limit: rowsPerPage,
                });
            } else {
                data = await conflitAPI.getAll({
                    page: page + 1,
                    limit: rowsPerPage,
                    resolu: filter === 'resolus' ? 'true' : undefined,
                });
            }
            setConflits(data.data || []);
            setTotal(data.pagination?.total || 0);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const handleResoudre = async (id) => {
        try {
            await conflitAPI.update(id, { resolu: true, date_resolution: new Date().toISOString() });
            loadConflits();
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const handleView = (conflit) => {
        setSelectedConflit(conflit);
        setOpen(true);
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
                            size="small"
                        >
                            Retour
                        </Button>
                        <Typography variant="h5" fontWeight="bold">
                            Gestion des Conflits
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant={filter === 'all' ? 'contained' : 'outlined'}
                            onClick={() => setFilter('all')}
                        >
                            Tous
                        </Button>
                        <Button
                            variant={filter === 'non-resolus' ? 'contained' : 'outlined'}
                            color="error"
                            onClick={() => setFilter('non-resolus')}
                        >
                            Non résolus
                        </Button>
                        <Button
                            variant={filter === 'resolus' ? 'contained' : 'outlined'}
                            color="success"
                            onClick={() => setFilter('resolus')}
                        >
                            Résolus
                        </Button>
                    </Box>
                </Box>

                {filter === 'non-resolus' && conflits.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {conflits.length} conflit(s) non résolu(s) nécessitent votre attention
                    </Alert>
                )}

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Type</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Date de détection</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {conflits.map((conflit) => (
                                <TableRow key={conflit.id_conflit}>
                                    <TableCell>
                                        <Chip
                                            label={conflit.type_conflit}
                                            color={
                                                conflit.type_conflit === 'salle'
                                                    ? 'error'
                                                    : conflit.type_conflit === 'enseignant'
                                                      ? 'warning'
                                                      : 'info'
                                            }
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{conflit.description}</TableCell>
                                    <TableCell>
                                        {new Date(conflit.date_detection).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={conflit.resolu ? 'Résolu' : 'Non résolu'}
                                            color={conflit.resolu ? 'success' : 'error'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleView(conflit)}
                                        >
                                            <Visibility />
                                        </IconButton>
                                        {!conflit.resolu && (
                                            <IconButton
                                                size="small"
                                                color="success"
                                                onClick={() => handleResoudre(conflit.id_conflit)}
                                            >
                                                <CheckCircle />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <TablePagination
                        component="div"
                        count={total}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                    />
                </TableContainer>

                {/* Dialog pour voir les détails */}
                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Détails du conflit</DialogTitle>
                    <DialogContent>
                        {selectedConflit && (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <Typography>
                                    <strong>Type :</strong> {selectedConflit.type_conflit}
                                </Typography>
                                <Typography>
                                    <strong>Description :</strong> {selectedConflit.description}
                                </Typography>
                                <Typography>
                                    <strong>Date de détection :</strong>{' '}
                                    {new Date(selectedConflit.date_detection).toLocaleString('fr-FR')}
                                </Typography>
                                <Typography>
                                    <strong>Statut :</strong>{' '}
                                    {selectedConflit.resolu ? 'Résolu' : 'Non résolu'}
                                </Typography>
                                {selectedConflit.resolu && selectedConflit.date_resolution && (
                                    <Typography>
                                        <strong>Date de résolution :</strong>{' '}
                                        {new Date(selectedConflit.date_resolution).toLocaleString('fr-FR')}
                                    </Typography>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpen(false)}>Fermer</Button>
                        {selectedConflit && !selectedConflit.resolu && (
                            <Button
                                variant="contained"
                                color="success"
                                onClick={() => {
                                    handleResoudre(selectedConflit.id_conflit);
                                    setOpen(false);
                                }}
                            >
                                Marquer comme résolu
                            </Button>
                        )}
                    </DialogActions>
                </Dialog>
            </Box>
        </DashboardLayout>
    );
}

