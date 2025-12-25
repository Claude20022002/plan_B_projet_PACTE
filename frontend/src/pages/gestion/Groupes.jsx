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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { groupeAPI, filiereAPI } from '../../services/api';
import { useFormik } from 'formik';
import * as yup from 'yup';

const validationSchema = yup.object({
    nom_groupe: yup.string().required('Le nom du groupe est requis'),
    niveau: yup.string().required('Le niveau est requis'),
    effectif: yup.number().min(0, 'L\'effectif doit être positif'),
    annee_scolaire: yup.string().required('L\'année scolaire est requise'),
    id_filiere: yup.number().required('La filière est requise'),
});

export default function Groupes() {
    const [groupes, setGroupes] = useState([]);
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
        loadGroupes();
        loadFilieres();
    }, [page, rowsPerPage]);

    const loadFilieres = async () => {
        try {
            const data = await filiereAPI.getAll({ limit: 1000 });
            setFilieres(data.data || []);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const loadGroupes = async () => {
        try {
            const data = await groupeAPI.getAll({
                page: page + 1,
                limit: rowsPerPage,
            });
            setGroupes(data.data || []);
            setTotal(data.pagination?.total || 0);
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors du chargement des groupes');
        }
    };

    const formik = useFormik({
        initialValues: {
            nom_groupe: '',
            niveau: '',
            effectif: 0,
            annee_scolaire: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
            id_filiere: '',
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError('');
                setSuccess('');
                if (editing) {
                    await groupeAPI.update(editing.id_groupe, values);
                    setSuccess('Groupe modifié avec succès');
                } else {
                    await groupeAPI.create(values);
                    setSuccess('Groupe créé avec succès');
                }
                formik.resetForm();
                setOpen(false);
                setEditing(null);
                loadGroupes();
            } catch (error) {
                console.error('Erreur:', error);
                setError(error.message || 'Erreur lors de la sauvegarde');
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleEdit = (groupe) => {
        setEditing(groupe);
        formik.setValues({
            nom_groupe: groupe.nom_groupe,
            niveau: groupe.niveau,
            effectif: groupe.effectif || 0,
            annee_scolaire: groupe.annee_scolaire,
            id_filiere: groupe.id_filiere,
        });
        setOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
            try {
                await groupeAPI.delete(id);
                setSuccess('Groupe supprimé avec succès');
                loadGroupes();
            } catch (error) {
                console.error('Erreur:', error);
                setError('Erreur lors de la suppression');
            }
        }
    };

    const filteredGroupes = groupes.filter(
        (g) =>
            g.nom_groupe?.toLowerCase().includes(search.toLowerCase()) ||
            g.filiere?.nom_filiere?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <DashboardLayout>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Gestion des Groupes
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setEditing(null);
                            setError('');
                            setSuccess('');
                            formik.resetForm({
                                values: {
                                    nom_groupe: '',
                                    niveau: '',
                                    effectif: 0,
                                    annee_scolaire: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
                                    id_filiere: '',
                                },
                            });
                            setOpen(true);
                        }}
                    >
                        Ajouter un groupe
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
                            placeholder="Rechercher un groupe..."
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
                                <TableCell>Niveau</TableCell>
                                <TableCell>Effectif</TableCell>
                                <TableCell>Année scolaire</TableCell>
                                <TableCell>Filière</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredGroupes.map((groupe) => (
                                <TableRow key={groupe.id_groupe}>
                                    <TableCell>{groupe.nom_groupe}</TableCell>
                                    <TableCell>{groupe.niveau}</TableCell>
                                    <TableCell>{groupe.effectif}</TableCell>
                                    <TableCell>{groupe.annee_scolaire}</TableCell>
                                    <TableCell>{groupe.filiere?.nom_filiere || '-'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleEdit(groupe)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(groupe.id_groupe)}>
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
                        <DialogTitle>{editing ? 'Modifier le groupe' : 'Nouveau groupe'}</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Nom du groupe"
                                    name="nom_groupe"
                                    value={formik.values.nom_groupe}
                                    onChange={formik.handleChange}
                                    error={formik.touched.nom_groupe && Boolean(formik.errors.nom_groupe)}
                                    helperText={formik.touched.nom_groupe && formik.errors.nom_groupe}
                                />
                                <TextField
                                    fullWidth
                                    label="Niveau"
                                    name="niveau"
                                    value={formik.values.niveau}
                                    onChange={formik.handleChange}
                                    error={formik.touched.niveau && Boolean(formik.errors.niveau)}
                                    helperText={formik.touched.niveau && formik.errors.niveau}
                                />
                                <TextField
                                    fullWidth
                                    label="Effectif"
                                    name="effectif"
                                    type="number"
                                    value={formik.values.effectif}
                                    onChange={formik.handleChange}
                                    error={formik.touched.effectif && Boolean(formik.errors.effectif)}
                                    helperText={formik.touched.effectif && formik.errors.effectif}
                                />
                                <TextField
                                    fullWidth
                                    label="Année scolaire (ex: 2024-2025)"
                                    name="annee_scolaire"
                                    value={formik.values.annee_scolaire}
                                    onChange={formik.handleChange}
                                    error={formik.touched.annee_scolaire && Boolean(formik.errors.annee_scolaire)}
                                    helperText={formik.touched.annee_scolaire && formik.errors.annee_scolaire}
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Filière</InputLabel>
                                    <Select
                                        name="id_filiere"
                                        value={formik.values.id_filiere}
                                        onChange={formik.handleChange}
                                        label="Filière"
                                        error={formik.touched.id_filiere && Boolean(formik.errors.id_filiere)}
                                    >
                                        {filieres.map((filiere) => (
                                            <MenuItem key={filiere.id_filiere} value={filiere.id_filiere}>
                                                {filiere.nom_filiere} ({filiere.code_filiere})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
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

