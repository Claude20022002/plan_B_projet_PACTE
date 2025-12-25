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
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    Alert,
    Snackbar,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { filiereAPI } from '../../services/api';
import { useFormik } from 'formik';
import * as yup from 'yup';

const validationSchema = yup.object({
    code_filiere: yup.string().required('Le code filière est requis'),
    nom_filiere: yup.string().required('Le nom de la filière est requis'),
    description: yup.string(),
});

export default function Filieres() {
    const [filieres, setFilieres] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadFilieres();
    }, [page, rowsPerPage]);

    const loadFilieres = async () => {
        try {
            const data = await filiereAPI.getAll({
                page: page + 1,
                limit: rowsPerPage,
            });
            setFilieres(data.data || []);
            setTotal(data.pagination?.total || 0);
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors du chargement des filières');
        }
    };

    const formik = useFormik({
        initialValues: {
            code_filiere: '',
            nom_filiere: '',
            description: '',
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError('');
                setSuccess('');
                if (editing) {
                    await filiereAPI.update(editing.id_filiere, values);
                    setSuccess('Filière modifiée avec succès');
                } else {
                    await filiereAPI.create(values);
                    setSuccess('Filière créée avec succès');
                }
                formik.resetForm();
                setOpen(false);
                setEditing(null);
                loadFilieres();
            } catch (error) {
                console.error('Erreur:', error);
                setError(error.message || 'Erreur lors de la sauvegarde');
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleEdit = (filiere) => {
        setEditing(filiere);
        formik.setValues({
            code_filiere: filiere.code_filiere,
            nom_filiere: filiere.nom_filiere,
            description: filiere.description || '',
        });
        setOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette filière ?')) {
            try {
                await filiereAPI.delete(id);
                setSuccess('Filière supprimée avec succès');
                loadFilieres();
            } catch (error) {
                console.error('Erreur:', error);
                setError('Erreur lors de la suppression');
            }
        }
    };

    const filteredFilieres = filieres.filter(
        (f) =>
            f.code_filiere?.toLowerCase().includes(search.toLowerCase()) ||
            f.nom_filiere?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Gestion des Filières
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setEditing(null);
                            setError('');
                            setSuccess('');
                            formik.resetForm();
                            setOpen(true);
                        }}
                    >
                        Ajouter une filière
                    </Button>
                </Box>

                {error && (
                    <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
                        <Alert onClose={() => setError('')} severity="error">
                            {error}
                        </Alert>
                    </Snackbar>
                )}

                {success && (
                    <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
                        <Alert onClose={() => setSuccess('')} severity="success">
                            {success}
                        </Alert>
                    </Snackbar>
                )}

                <Paper sx={{ mb: 2 }}>
                    <Box sx={{ p: 2 }}>
                        <TextField
                            fullWidth
                            placeholder="Rechercher une filière..."
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
                                <TableCell>Code</TableCell>
                                <TableCell>Nom</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredFilieres.map((filiere) => (
                                <TableRow key={filiere.id_filiere}>
                                    <TableCell>{filiere.code_filiere}</TableCell>
                                    <TableCell>{filiere.nom_filiere}</TableCell>
                                    <TableCell>{filiere.description || '-'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleEdit(filiere)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(filiere.id_filiere)}>
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

                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                    <form onSubmit={formik.handleSubmit}>
                        <DialogTitle>{editing ? 'Modifier la filière' : 'Nouvelle filière'}</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Code filière"
                                    name="code_filiere"
                                    value={formik.values.code_filiere}
                                    onChange={formik.handleChange}
                                    error={formik.touched.code_filiere && Boolean(formik.errors.code_filiere)}
                                    helperText={formik.touched.code_filiere && formik.errors.code_filiere}
                                />
                                <TextField
                                    fullWidth
                                    label="Nom de la filière"
                                    name="nom_filiere"
                                    value={formik.values.nom_filiere}
                                    onChange={formik.handleChange}
                                    error={formik.touched.nom_filiere && Boolean(formik.errors.nom_filiere)}
                                    helperText={formik.touched.nom_filiere && formik.errors.nom_filiere}
                                />
                                <TextField
                                    fullWidth
                                    label="Description"
                                    name="description"
                                    multiline
                                    rows={3}
                                    value={formik.values.description}
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

