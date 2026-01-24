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
import { creneauAPI } from '../../services/api';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { parseFile, validateCreneauData } from '../../utils/fileImport';
import { List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const validationSchema = yup.object({
    jour_semaine: yup.string().required('Le jour de la semaine est requis'),
    heure_debut: yup.string().required('L\'heure de début est requise'),
    heure_fin: yup.string().required('L\'heure de fin est requise'),
    duree_minutes: yup.number().min(1, 'La durée doit être supérieure à 0').required(),
    periode: yup.string(),
});

const joursSemaine = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

export default function Creneaux() {
    const navigate = useNavigate();
    const [creneaux, setCreneaux] = useState([]);
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
        loadCreneaux();
    }, [page, rowsPerPage]);

    const loadCreneaux = async () => {
        try {
            const data = await creneauAPI.getAll({
                page: page + 1,
                limit: rowsPerPage,
            });
            setCreneaux(data.data || []);
            setTotal(data.pagination?.total || 0);
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors du chargement des créneaux');
        }
    };

    const calculateDuration = (heureDebut, heureFin) => {
        const [h1, m1] = heureDebut.split(':').map(Number);
        const [h2, m2] = heureFin.split(':').map(Number);
        const start = h1 * 60 + m1;
        const end = h2 * 60 + m2;
        return end - start;
    };

    const formik = useFormik({
        initialValues: {
            jour_semaine: '',
            heure_debut: '',
            heure_fin: '',
            duree_minutes: '',
            periode: '',
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError('');
                setSuccess('');
                const dataToSend = {
                    ...values,
                    duree_minutes: values.duree_minutes || calculateDuration(values.heure_debut, values.heure_fin),
                };
                if (editing) {
                    await creneauAPI.update(editing.id_creneau, dataToSend);
                    setSuccess('Créneau modifié avec succès');
                } else {
                    await creneauAPI.create(dataToSend);
                    setSuccess('Créneau créé avec succès');
                }
                formik.resetForm();
                setOpen(false);
                setEditing(null);
                loadCreneaux();
            } catch (error) {
                console.error('Erreur:', error);
                setError(error.message || 'Erreur lors de la sauvegarde');
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleEdit = (creneau) => {
        setEditing(creneau);
        formik.setValues({
            jour_semaine: creneau.jour_semaine,
            heure_debut: creneau.heure_debut,
            heure_fin: creneau.heure_fin,
            duree_minutes: creneau.duree_minutes || calculateDuration(creneau.heure_debut, creneau.heure_fin),
            periode: creneau.periode || '',
        });
        setOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce créneau ?')) {
            try {
                await creneauAPI.delete(id);
                setSuccess('Créneau supprimé avec succès');
                loadCreneaux();
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
            console.log('Données parsées depuis le fichier:', data);
            
            if (!data || data.length === 0) {
                setError('Le fichier est vide ou ne contient pas de données valides');
                setImportLoading(false);
                return;
            }
            
            const validation = validateCreneauData(data);
            
            if (!validation.valid) {
                setImportErrors(validation.errors);
                setError('Le fichier contient des erreurs. Veuillez les corriger avant de continuer.');
                return;
            }

            // Préparer les données pour l'import
            const creneauxToImport = data.map((row) => ({
                jour_semaine: row.jour_semaine?.trim().toLowerCase() || '',
                heure_debut: row.heure_debut?.trim() || '',
                heure_fin: row.heure_fin?.trim() || '',
                duree_minutes: row.duree_minutes ? Number(row.duree_minutes) : calculateDuration(row.heure_debut, row.heure_fin),
                periode: row.periode?.trim() || '',
            }));

            // Importer les créneaux une par une
            const results = { success: 0, errors: [] };
            for (const creneau of creneauxToImport) {
                try {
                    await creneauAPI.create(creneau);
                    results.success++;
                } catch (error) {
                    results.errors.push({
                        creneau: `${creneau.jour_semaine} ${creneau.heure_debut}-${creneau.heure_fin}`,
                        error: error.message || 'Erreur lors de la création',
                    });
                }
            }

            setSuccess(`${results.success} créneau(x) importé(s) avec succès`);
            if (results.errors.length > 0) {
                setImportErrors(results.errors.map(e => `${e.creneau}: ${e.error}`));
            }
            setImportOpen(false);
            loadCreneaux();
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            setError(error.message || 'Erreur lors de l\'import du fichier');
        } finally {
            setImportLoading(false);
        }
    };

    const filteredCreneaux = creneaux.filter(
        (c) =>
            c.jour_semaine?.toLowerCase().includes(search.toLowerCase()) ||
            c.heure_debut?.includes(search) ||
            c.periode?.toLowerCase().includes(search.toLowerCase())
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
                            Gestion des Créneaux
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
                            Ajouter un créneau
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
                            placeholder="Rechercher un créneau..."
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
                                <TableCell>Jour</TableCell>
                                <TableCell>Heure début</TableCell>
                                <TableCell>Heure fin</TableCell>
                                <TableCell>Durée (min)</TableCell>
                                <TableCell>Période</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredCreneaux.map((creneau) => (
                                <TableRow key={creneau.id_creneau}>
                                    <TableCell>{creneau.jour_semaine}</TableCell>
                                    <TableCell>{creneau.heure_debut}</TableCell>
                                    <TableCell>{creneau.heure_fin}</TableCell>
                                    <TableCell>{creneau.duree_minutes}</TableCell>
                                    <TableCell>{creneau.periode || '-'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleEdit(creneau)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(creneau.id_creneau)}>
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
                        <DialogTitle>{editing ? 'Modifier le créneau' : 'Nouveau créneau'}</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Jour de la semaine</InputLabel>
                                    <Select
                                        name="jour_semaine"
                                        value={formik.values.jour_semaine}
                                        onChange={formik.handleChange}
                                        label="Jour de la semaine"
                                        error={formik.touched.jour_semaine && Boolean(formik.errors.jour_semaine)}
                                    >
                                        {joursSemaine.map((jour) => (
                                            <MenuItem key={jour} value={jour}>
                                                {jour.charAt(0).toUpperCase() + jour.slice(1)}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    label="Heure de début"
                                    name="heure_debut"
                                    type="time"
                                    value={formik.values.heure_debut}
                                    onChange={(e) => {
                                        formik.handleChange(e);
                                        if (formik.values.heure_fin) {
                                            const duration = calculateDuration(e.target.value, formik.values.heure_fin);
                                            formik.setFieldValue('duree_minutes', duration > 0 ? duration : '');
                                        }
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                    error={formik.touched.heure_debut && Boolean(formik.errors.heure_debut)}
                                    helperText={formik.touched.heure_debut && formik.errors.heure_debut}
                                />
                                <TextField
                                    fullWidth
                                    label="Heure de fin"
                                    name="heure_fin"
                                    type="time"
                                    value={formik.values.heure_fin}
                                    onChange={(e) => {
                                        formik.handleChange(e);
                                        if (formik.values.heure_debut) {
                                            const duration = calculateDuration(formik.values.heure_debut, e.target.value);
                                            formik.setFieldValue('duree_minutes', duration > 0 ? duration : '');
                                        }
                                    }}
                                    InputLabelProps={{ shrink: true }}
                                    error={formik.touched.heure_fin && Boolean(formik.errors.heure_fin)}
                                    helperText={formik.touched.heure_fin && formik.errors.heure_fin}
                                />
                                <TextField
                                    fullWidth
                                    label="Durée (minutes)"
                                    name="duree_minutes"
                                    type="number"
                                    value={formik.values.duree_minutes}
                                    onChange={formik.handleChange}
                                    error={formik.touched.duree_minutes && Boolean(formik.errors.duree_minutes)}
                                    helperText={formik.touched.duree_minutes && formik.errors.duree_minutes}
                                />
                                <TextField
                                    fullWidth
                                    label="Période"
                                    name="periode"
                                    value={formik.values.periode}
                                    onChange={formik.handleChange}
                                    helperText="Période de l'année (ex: S1, S2, ou période spécifique). Optionnel."
                                    placeholder="Ex: S1, S2, Trimestre 1..."
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
                    <DialogTitle>Importer des créneaux (Excel/CSV)</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    <strong>Format du fichier requis :</strong>
                                </Typography>
                                <Typography variant="body2" component="div">
                                    Les colonnes requises sont : <strong>jour_semaine</strong>, <strong>heure_debut</strong>, <strong>heure_fin</strong>
                                </Typography>
                                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                                    Colonnes optionnelles : <strong>duree_minutes</strong>, <strong>periode</strong>
                                </Typography>
                                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                                    Jours acceptés : <strong>lundi</strong>, <strong>mardi</strong>, <strong>mercredi</strong>, <strong>jeudi</strong>, <strong>vendredi</strong>, <strong>samedi</strong>, <strong>dimanche</strong>
                                </Typography>
                            </Alert>
                            
                            <input
                                accept=".csv,.xlsx,.xls"
                                style={{ display: 'none' }}
                                id="import-creneau-file-input"
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        handleFileImport(file);
                                    }
                                }}
                            />
                            <label htmlFor="import-creneau-file-input">
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

