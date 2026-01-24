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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
} from '@mui/material';
import { Add, Edit, Delete, Search, ArrowBack, UploadFile } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { salleAPI } from '../../services/api';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { parseFile, validateSalleData } from '../../utils/fileImport';
import { Alert, Snackbar, List, ListItem, ListItemText, CircularProgress } from '@mui/material';

const validationSchema = yup.object({
    nom_salle: yup.string().required('Le nom de la salle est requis'),
    type_salle: yup.string().required('Le type de salle est requis'),
    capacite: yup.number().min(1, 'La capacité doit être supérieure à 0').required(),
    batiment: yup.string().required('Le bâtiment est requis'),
});

export default function Salles() {
    const navigate = useNavigate();
    const [salles, setSalles] = useState([]);
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
                setSuccess('Salle supprimée avec succès');
                loadSalles();
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
            
            const validation = validateSalleData(data);
            
            if (!validation.valid) {
                setImportErrors(validation.errors);
                setError('Le fichier contient des erreurs. Veuillez les corriger avant de continuer.');
                return;
            }

            // Préparer les données pour l'import
            const sallesToImport = data.map((row) => ({
                nom_salle: row.nom_salle?.trim() || '',
                type_salle: row.type_salle?.trim().toLowerCase() || '',
                capacite: row.capacite ? Number(row.capacite) : 0,
                batiment: row.batiment?.trim() || '',
                etage: row.etage !== undefined && row.etage !== '' ? Number(row.etage) : null,
                equipements: row.equipements?.trim() || '',
                disponible: row.disponible !== undefined ? Boolean(row.disponible) : true,
            }));

            // Importer les salles une par une
            const results = { success: 0, errors: [] };
            for (const salle of sallesToImport) {
                try {
                    await salleAPI.create(salle);
                    results.success++;
                } catch (error) {
                    results.errors.push({
                        nom: salle.nom_salle,
                        error: error.message || 'Erreur lors de la création',
                    });
                }
            }

            setSuccess(`${results.success} salle(s) importée(s) avec succès`);
            if (results.errors.length > 0) {
                setImportErrors(results.errors.map(e => `${e.nom}: ${e.error}`));
            }
            setImportOpen(false);
            loadSalles();
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            setError(error.message || 'Erreur lors de l\'import du fichier');
        } finally {
            setImportLoading(false);
        }
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
                            Gestion des Salles
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
                                formik.resetForm();
                                setOpen(true);
                            }}
                        >
                            Ajouter une salle
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
                                    <TableCell>
                                        {salle.etage === null || salle.etage === undefined
                                            ? '-'
                                            : salle.etage === -1
                                              ? 'Sous-sol'
                                              : salle.etage === 0
                                                ? 'Rez-de-chaussée'
                                                : `${salle.etage}ème étage`}
                                    </TableCell>
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
                                <FormControl fullWidth>
                                    <InputLabel>Type de salle</InputLabel>
                                    <Select
                                        name="type_salle"
                                        value={formik.values.type_salle}
                                        onChange={formik.handleChange}
                                        label="Type de salle"
                                        error={formik.touched.type_salle && Boolean(formik.errors.type_salle)}
                                    >
                                        <MenuItem value="amphi">Amphithéâtre</MenuItem>
                                        <MenuItem value="informatique">Salle informatique</MenuItem>
                                        <MenuItem value="standard">Salle standard</MenuItem>
                                        <MenuItem value="labo">Laboratoire</MenuItem>
                                        <MenuItem value="atelier">Atelier</MenuItem>
                                    </Select>
                                </FormControl>
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
                                <FormControl fullWidth>
                                    <InputLabel>Bâtiment</InputLabel>
                                    <Select
                                        name="batiment"
                                        value={formik.values.batiment}
                                        onChange={formik.handleChange}
                                        label="Bâtiment"
                                        error={formik.touched.batiment && Boolean(formik.errors.batiment)}
                                    >
                                        <MenuItem value="A">Bâtiment A</MenuItem>
                                        <MenuItem value="B">Bâtiment B</MenuItem>
                                        <MenuItem value="C">Bâtiment C</MenuItem>
                                        <MenuItem value="D">Bâtiment D</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth>
                                    <InputLabel>Étage</InputLabel>
                                    <Select
                                        name="etage"
                                        value={formik.values.etage}
                                        onChange={formik.handleChange}
                                        label="Étage"
                                    >
                                        <MenuItem value="-1">Sous-sol</MenuItem>
                                        <MenuItem value="0">Rez-de-chaussée</MenuItem>
                                        <MenuItem value="1">1er étage</MenuItem>
                                        <MenuItem value="2">2ème étage</MenuItem>
                                        <MenuItem value="3">3ème étage</MenuItem>
                                        <MenuItem value="4">4ème étage</MenuItem>
                                        <MenuItem value="5">5ème étage</MenuItem>
                                    </Select>
                                </FormControl>
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

                {/* Dialog d'import */}
                <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Importer des salles (Excel/CSV)</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    <strong>Format du fichier requis :</strong>
                                </Typography>
                                <Typography variant="body2" component="div">
                                    Les colonnes requises sont : <strong>nom_salle</strong>, <strong>type_salle</strong>, <strong>capacite</strong>, <strong>batiment</strong>
                                </Typography>
                                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                                    Colonnes optionnelles : <strong>etage</strong>, <strong>equipements</strong>, <strong>disponible</strong>
                                </Typography>
                                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                                    Types de salle acceptés : <strong>amphi</strong>, <strong>informatique</strong>, <strong>standard</strong>, <strong>labo</strong>, <strong>atelier</strong>
                                </Typography>
                            </Alert>
                            
                            <input
                                accept=".csv,.xlsx,.xls"
                                style={{ display: 'none' }}
                                id="import-salle-file-input"
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        handleFileImport(file);
                                    }
                                }}
                            />
                            <label htmlFor="import-salle-file-input">
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

