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
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { salleAPI } from '../../services/api';
import { useFormik } from 'formik';
import * as yup from 'yup';

const validationSchema = yup.object({
    nom_salle: yup.string().required('Le nom de la salle est requis'),
    type_salle: yup.string().required('Le type de salle est requis'),
    capacite: yup.number().min(1, 'La capacité doit être supérieure à 0').required(),
    batiment: yup.string().required('Le bâtiment est requis'),
});

export default function Salles() {
    const [salles, setSalles] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadSalles();
    }, [page, rowsPerPage, search]);

    const loadSalles = async () => {
        try {
            const data = await salleAPI.getAll({
                page: page + 1,
                limit: rowsPerPage,
            });
            setSalles(data.data || []);
            setTotal(data.pagination?.total || 0);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const formik = useFormik({
        initialValues: {
            nom_salle: '',
            type_salle: '',
            capacite: '',
            batiment: '',
            etage: '',
            equipements: '',
            disponible: true,
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                if (editing) {
                    await salleAPI.update(editing.id_salle, values);
                } else {
                    await salleAPI.create(values);
                }
                formik.resetForm();
                setOpen(false);
                setEditing(null);
                loadSalles();
            } catch (error) {
                console.error('Erreur:', error);
            }
        },
    });

    const handleEdit = (salle) => {
        setEditing(salle);
        formik.setValues({
            nom_salle: salle.nom_salle,
            type_salle: salle.type_salle,
            capacite: salle.capacite,
            batiment: salle.batiment,
            etage: salle.etage || '',
            equipements: salle.equipements || '',
            disponible: salle.disponible,
        });
        setOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette salle ?')) {
            try {
                await salleAPI.delete(id);
                loadSalles();
            } catch (error) {
                console.error('Erreur:', error);
            }
        }
    };

    return (
        <DashboardLayout>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Gestion des Salles
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setEditing(null);
                            formik.resetForm();
                            setOpen(true);
                        }}
                    >
                        Ajouter une salle
                    </Button>
                </Box>

                <Paper sx={{ mb: 2 }}>
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
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {salles.map((salle) => (
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
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEdit(salle)}
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(salle.id_salle)}
                                        >
                                            <Delete />
                                        </IconButton>
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

                {/* Dialog pour créer/modifier */}
                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                    <form onSubmit={formik.handleSubmit}>
                        <DialogTitle>
                            {editing ? 'Modifier la salle' : 'Nouvelle salle'}
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Nom de la salle"
                                    name="nom_salle"
                                    value={formik.values.nom_salle}
                                    onChange={formik.handleChange}
                                    error={formik.touched.nom_salle && Boolean(formik.errors.nom_salle)}
                                    helperText={formik.touched.nom_salle && formik.errors.nom_salle}
                                />
                                <TextField
                                    fullWidth
                                    label="Type de salle"
                                    name="type_salle"
                                    value={formik.values.type_salle}
                                    onChange={formik.handleChange}
                                    error={formik.touched.type_salle && Boolean(formik.errors.type_salle)}
                                    helperText={formik.touched.type_salle && formik.errors.type_salle}
                                />
                                <TextField
                                    fullWidth
                                    label="Capacité"
                                    name="capacite"
                                    type="number"
                                    value={formik.values.capacite}
                                    onChange={formik.handleChange}
                                    error={formik.touched.capacite && Boolean(formik.errors.capacite)}
                                    helperText={formik.touched.capacite && formik.errors.capacite}
                                />
                                <TextField
                                    fullWidth
                                    label="Bâtiment"
                                    name="batiment"
                                    value={formik.values.batiment}
                                    onChange={formik.handleChange}
                                    error={formik.touched.batiment && Boolean(formik.errors.batiment)}
                                    helperText={formik.touched.batiment && formik.errors.batiment}
                                />
                                <TextField
                                    fullWidth
                                    label="Étage"
                                    name="etage"
                                    type="number"
                                    value={formik.values.etage}
                                    onChange={formik.handleChange}
                                />
                                <TextField
                                    fullWidth
                                    label="Équipements"
                                    name="equipements"
                                    multiline
                                    rows={3}
                                    value={formik.values.equipements}
                                    onChange={formik.handleChange}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpen(false)}>Annuler</Button>
                            <Button type="submit" variant="contained">
                                {editing ? 'Modifier' : 'Créer'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Box>
        </DashboardLayout>
    );
}

