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
import { Add, Edit, Delete, Search, UploadFile, ArrowBack } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { filiereAPI } from '../../services/api';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { parseFile, validateFiliereData } from '../../utils/fileImport';
import { List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const validationSchema = yup.object({
    code_filiere: yup.string().required('Le code filière est requis'),
    nom_filiere: yup.string().required('Le nom de la filière est requis'),
    description: yup.string(),
});

export default function Filieres() {
    const navigate = useNavigate();
    const [filieres, setFilieres] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [importOpen, setImportOpen] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [importErrors, setImportErrors] = useState([]);

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

    const handleFileImport = async (file) => {
        setImportLoading(true);
        setImportErrors([]);
        try {
            const data = await parseFile(file);
            const validation = validateFiliereData(data);
            
            if (!validation.valid) {
                setImportErrors(validation.errors);
                setError('Le fichier contient des erreurs. Veuillez les corriger avant de continuer.');
                return;
            }

            // Préparer les données pour l'import
            const filieresToImport = data.map((row) => ({
                code_filiere: row.code_filiere?.trim() || '',
                nom_filiere: row.nom_filiere?.trim() || '',
                description: row.description?.trim() || '',
            }));

            // Importer les filières une par une
            const results = { success: 0, errors: [] };
            for (const filiere of filieresToImport) {
                try {
                    await filiereAPI.create(filiere);
                    results.success++;
                } catch (error) {
                    results.errors.push({
                        code: filiere.code_filiere,
                        error: error.message || 'Erreur lors de la création',
                    });
                }
            }

            setSuccess(`${results.success} filière(s) importée(s) avec succès`);
            if (results.errors.length > 0) {
                setImportErrors(results.errors.map(e => `${e.code}: ${e.error}`));
            }
            setImportOpen(false);
            loadFilieres();
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            setError(error.message || 'Erreur lors de l\'import du fichier');
        } finally {
            setImportLoading(false);
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
                            Gestion des Filières
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<UploadFile />}
                            onClick={() => {
                                setImportOpen(true);
                                setImportErrors([]);
                            }}
                        >
                            Importer (Excel/CSV)
                        </Button>
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

                {/* Dialog d'import */}
                <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Importer des filières (Excel/CSV)</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    <strong>Format du fichier requis :</strong>
                                </Typography>
                                <Typography variant="body2" component="div">
                                    Les colonnes requises sont : <strong>nom_filiere</strong>, <strong>code_filiere</strong>
                                </Typography>
                                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                                    Colonnes optionnelles : <strong>description</strong>
                                </Typography>
                            </Alert>
                            
                            <input
                                accept=".csv,.xlsx,.xls"
                                style={{ display: 'none' }}
                                id="import-filiere-file-input"
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        handleFileImport(file);
                                    }
                                }}
                            />
                            <label htmlFor="import-filiere-file-input">
                                <Button
                                    variant="outlined"
                                    component="span"
                                    startIcon={<UploadFile />}
                                    fullWidth
                                    disabled={importLoading}
                                >
                                    {importLoading ? 'Import en cours...' : 'Sélectionner un fichier'}
                                </Button>
                            </label>

                            {importLoading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                    <CircularProgress />
                                </Box>
                            )}

                            {importErrors.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                    <Alert severity="error">
                                        <Typography variant="subtitle2" gutterBottom>
                                            Erreurs détectées ({importErrors.length}) :
                                        </Typography>
                                        <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                                            {importErrors.map((err, index) => (
                                                <ListItem key={index}>
                                                    <ListItemText primary={err} />
                                                </ListItem>
                                            ))}
                                        </List>
                                    </Alert>
                                </Box>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            setImportOpen(false);
                            setImportErrors([]);
                        }}>
                            Fermer
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </DashboardLayout>
    );
}

