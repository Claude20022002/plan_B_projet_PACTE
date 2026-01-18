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
import { Add, Edit, Delete, Search, UploadFile, ArrowBack } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { coursAPI, filiereAPI } from '../../services/api';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { parseFile, validateCoursData } from '../../utils/fileImport';
import { List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const validationSchema = yup.object({
    code_cours: yup.string().required('Le code cours est requis'),
    nom_cours: yup.string().required('Le nom du cours est requis'),
    niveau: yup.string().required('Le niveau est requis'),
    volume_horaire: yup.number().min(1, 'Le volume horaire doit être supérieur à 0').required(),
    type_cours: yup.string().required('Le type de cours est requis'),
    semestre: yup.string().required('Le semestre est requis'),
    coefficient: yup.number().min(0, 'Le coefficient doit être positif'),
    id_filiere: yup.number().required('La filière est requise'),
});

export default function Cours() {
    const navigate = useNavigate();
    const [cours, setCours] = useState([]);
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
        loadCours();
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

    const loadCours = async () => {
        try {
            const data = await coursAPI.getAll({
                page: page + 1,
                limit: rowsPerPage,
            });
            setCours(data.data || []);
            setTotal(data.pagination?.total || 0);
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors du chargement des cours');
        }
    };

    const formik = useFormik({
        initialValues: {
            code_cours: '',
            nom_cours: '',
            niveau: '',
            volume_horaire: '',
            type_cours: '',
            semestre: '',
            coefficient: 1.0,
            id_filiere: '',
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError('');
                setSuccess('');
                if (editing) {
                    await coursAPI.update(editing.id_cours, values);
                    setSuccess('Cours modifié avec succès');
                } else {
                    await coursAPI.create(values);
                    setSuccess('Cours créé avec succès');
                }
                formik.resetForm();
                setOpen(false);
                setEditing(null);
                loadCours();
            } catch (error) {
                console.error('Erreur:', error);
                setError(error.message || 'Erreur lors de la sauvegarde');
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleEdit = (coursItem) => {
        setEditing(coursItem);
        formik.setValues({
            code_cours: coursItem.code_cours,
            nom_cours: coursItem.nom_cours,
            niveau: coursItem.niveau,
            volume_horaire: coursItem.volume_horaire,
            type_cours: coursItem.type_cours,
            semestre: coursItem.semestre,
            coefficient: coursItem.coefficient || 1.0,
            id_filiere: coursItem.id_filiere,
        });
        setOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cours ?')) {
            try {
                await coursAPI.delete(id);
                setSuccess('Cours supprimé avec succès');
                loadCours();
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
            const validation = validateCoursData(data);
            
            if (!validation.valid) {
                setImportErrors(validation.errors);
                setError('Le fichier contient des erreurs. Veuillez les corriger avant de continuer.');
                return;
            }

            // Préparer les données pour l'import
            const coursToImport = data.map((row) => ({
                code_cours: row.code_cours?.trim() || '',
                nom_cours: row.nom_cours?.trim() || '',
                id_filiere: row.id_filiere ? Number(row.id_filiere) : null,
                niveau: row.niveau?.trim() || '',
                volume_horaire: row.volume_horaire ? Number(row.volume_horaire) : null,
                type_cours: row.type_cours?.trim() || '',
                semestre: row.semestre?.trim() || '',
                coefficient: row.coefficient ? Number(row.coefficient) : 1.0,
            }));

            // Importer les cours une par une
            const results = { success: 0, errors: [] };
            for (const coursItem of coursToImport) {
                try {
                    await coursAPI.create(coursItem);
                    results.success++;
                } catch (error) {
                    results.errors.push({
                        code: coursItem.code_cours,
                        error: error.message || 'Erreur lors de la création',
                    });
                }
            }

            setSuccess(`${results.success} cours importé(s) avec succès`);
            if (results.errors.length > 0) {
                setImportErrors(results.errors.map(e => `${e.code}: ${e.error}`));
            }
            setImportOpen(false);
            loadCours();
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            setError(error.message || 'Erreur lors de l\'import du fichier');
        } finally {
            setImportLoading(false);
        }
    };

    const filteredCours = cours.filter(
        (c) =>
            c.code_cours?.toLowerCase().includes(search.toLowerCase()) ||
            c.nom_cours?.toLowerCase().includes(search.toLowerCase()) ||
            c.filiere?.nom_filiere?.toLowerCase().includes(search.toLowerCase())
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
                            Gestion des Cours
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
                            Ajouter un cours
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
                            placeholder="Rechercher un cours..."
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
                                <TableCell>Niveau</TableCell>
                                <TableCell>Volume horaire</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Semestre</TableCell>
                                <TableCell>Filière</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredCours.map((coursItem) => (
                                <TableRow key={coursItem.id_cours}>
                                    <TableCell>{coursItem.code_cours}</TableCell>
                                    <TableCell>{coursItem.nom_cours}</TableCell>
                                    <TableCell>{coursItem.niveau}</TableCell>
                                    <TableCell>{coursItem.volume_horaire}h</TableCell>
                                    <TableCell>{coursItem.type_cours}</TableCell>
                                    <TableCell>{coursItem.semestre}</TableCell>
                                    <TableCell>{coursItem.filiere?.nom_filiere || '-'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleEdit(coursItem)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(coursItem.id_cours)}>
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
                        <DialogTitle>{editing ? 'Modifier le cours' : 'Nouveau cours'}</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Code cours"
                                    name="code_cours"
                                    value={formik.values.code_cours}
                                    onChange={formik.handleChange}
                                    error={formik.touched.code_cours && Boolean(formik.errors.code_cours)}
                                    helperText={formik.touched.code_cours && formik.errors.code_cours}
                                />
                                <TextField
                                    fullWidth
                                    label="Nom du cours"
                                    name="nom_cours"
                                    value={formik.values.nom_cours}
                                    onChange={formik.handleChange}
                                    error={formik.touched.nom_cours && Boolean(formik.errors.nom_cours)}
                                    helperText={formik.touched.nom_cours && formik.errors.nom_cours}
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
                                    label="Volume horaire (heures)"
                                    name="volume_horaire"
                                    type="number"
                                    value={formik.values.volume_horaire}
                                    onChange={formik.handleChange}
                                    error={formik.touched.volume_horaire && Boolean(formik.errors.volume_horaire)}
                                    helperText={formik.touched.volume_horaire && formik.errors.volume_horaire}
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Type de cours</InputLabel>
                                    <Select
                                        name="type_cours"
                                        value={formik.values.type_cours}
                                        onChange={formik.handleChange}
                                        label="Type de cours"
                                        error={formik.touched.type_cours && Boolean(formik.errors.type_cours)}
                                    >
                                        <MenuItem value="CM">CM - Cours Magistral</MenuItem>
                                        <MenuItem value="TD">TD - Travaux Dirigés</MenuItem>
                                        <MenuItem value="TP">TP - Travaux Pratiques</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    label="Semestre"
                                    name="semestre"
                                    value={formik.values.semestre}
                                    onChange={formik.handleChange}
                                    error={formik.touched.semestre && Boolean(formik.errors.semestre)}
                                    helperText={formik.touched.semestre && formik.errors.semestre}
                                />
                                <TextField
                                    fullWidth
                                    label="Coefficient"
                                    name="coefficient"
                                    type="number"
                                    step="0.1"
                                    value={formik.values.coefficient}
                                    onChange={formik.handleChange}
                                    error={formik.touched.coefficient && Boolean(formik.errors.coefficient)}
                                    helperText={formik.touched.coefficient && formik.errors.coefficient}
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

                {/* Dialog d'import */}
                <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Importer des cours (Excel/CSV)</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    <strong>Format du fichier requis :</strong>
                                </Typography>
                                <Typography variant="body2" component="div">
                                    Les colonnes requises sont : <strong>nom_cours</strong>, <strong>code_cours</strong>, <strong>id_filiere</strong>
                                </Typography>
                                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                                    Colonnes optionnelles : <strong>niveau</strong>, <strong>volume_horaire</strong>, <strong>type_cours</strong>, <strong>semestre</strong>, <strong>coefficient</strong>
                                </Typography>
                            </Alert>
                            
                            <input
                                accept=".csv,.xlsx,.xls"
                                style={{ display: 'none' }}
                                id="import-cours-file-input"
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        handleFileImport(file);
                                    }
                                }}
                            />
                            <label htmlFor="import-cours-file-input">
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

