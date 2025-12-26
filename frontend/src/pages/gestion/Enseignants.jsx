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
import { enseignantAPI, userAPI } from '../../services/api';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { parseFile, validateEnseignantData } from '../../utils/fileImport';
import { List, ListItem, ListItemText, CircularProgress } from '@mui/material';

const validationSchema = yup.object({
    id_user: yup.number().required('L\'utilisateur est requis'),
    specialite: yup.string().required('La spécialité est requise'),
    departement: yup.string().required('Le département est requis'),
    grade: yup.string(),
    bureau: yup.string(),
});

export default function Enseignants() {
    const [enseignants, setEnseignants] = useState([]);
    const [users, setUsers] = useState([]);
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
    const navigate = useNavigate();

    useEffect(() => {
        loadEnseignants();
        loadUsers();
    }, [page, rowsPerPage]);

    const loadUsers = async () => {
        try {
            const data = await userAPI.getAll({ limit: 1000 });
            const enseignantsUsers = (data.data || []).filter((u) => u.role === 'enseignant');
            setUsers(enseignantsUsers);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const loadEnseignants = async () => {
        try {
            const data = await enseignantAPI.getAll({
                page: page + 1,
                limit: rowsPerPage,
            });
            setEnseignants(data.data || []);
            setTotal(data.pagination?.total || 0);
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors du chargement des enseignants');
        }
    };

    const formik = useFormik({
        initialValues: {
            id_user: '',
            specialite: '',
            departement: '',
            grade: '',
            bureau: '',
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError('');
                setSuccess('');
                if (editing) {
                    await enseignantAPI.update(editing.id_user, values);
                    setSuccess('Enseignant modifié avec succès');
                } else {
                    await enseignantAPI.create(values);
                    setSuccess('Enseignant créé avec succès');
                }
                formik.resetForm();
                setOpen(false);
                setEditing(null);
                loadEnseignants();
                loadUsers();
            } catch (error) {
                console.error('Erreur:', error);
                setError(error.message || 'Erreur lors de la sauvegarde');
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleEdit = (enseignant) => {
        setEditing(enseignant);
        formik.setValues({
            id_user: enseignant.id_user,
            specialite: enseignant.specialite,
            departement: enseignant.departement,
            grade: enseignant.grade || '',
            bureau: enseignant.bureau || '',
        });
        setOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
            try {
                await enseignantAPI.delete(id);
                setSuccess('Enseignant supprimé avec succès');
                loadEnseignants();
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
            const validation = validateEnseignantData(data);
            
            if (!validation.valid) {
                setImportErrors(validation.errors);
                setError('Le fichier contient des erreurs. Veuillez les corriger avant de continuer.');
                return;
            }

            // Préparer les données pour l'import
            const enseignantsToImport = data.map((row) => ({
                nom: row.nom?.trim() || '',
                prenom: row.prenom?.trim() || '',
                email: row.email?.trim().toLowerCase() || '',
                telephone: row.telephone?.trim() || '',
                specialite: row.specialite?.trim() || '',
                departement: row.departement?.trim() || '',
                grade: row.grade?.trim() || '',
                bureau: row.bureau?.trim() || '',
                actif: row.actif !== undefined ? row.actif : true,
            }));

            const result = await enseignantAPI.importEnseignants(enseignantsToImport);
            setSuccess(`${result.successCount || result.success?.length || 0} enseignant(s) importé(s) avec succès`);
            if (result.errors && result.errors.length > 0) {
                setImportErrors(result.errors.map(e => e.error || e.message || 'Erreur inconnue'));
            }
            setImportOpen(false);
            loadEnseignants();
            loadUsers();
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            setError(error.message || 'Erreur lors de l\'import du fichier');
        } finally {
            setImportLoading(false);
        }
    };

    const filteredEnseignants = enseignants.filter(
        (ens) =>
            ens.user?.nom?.toLowerCase().includes(search.toLowerCase()) ||
            ens.user?.prenom?.toLowerCase().includes(search.toLowerCase()) ||
            ens.specialite?.toLowerCase().includes(search.toLowerCase())
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
                            Gestion des Enseignants
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
                            Ajouter un enseignant
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
                            placeholder="Rechercher un enseignant..."
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
                                <TableCell>Prénom</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Spécialité</TableCell>
                                <TableCell>Département</TableCell>
                                <TableCell>Grade</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredEnseignants.map((ens) => (
                                <TableRow key={ens.id_user}>
                                    <TableCell>{ens.user?.nom || '-'}</TableCell>
                                    <TableCell>{ens.user?.prenom || '-'}</TableCell>
                                    <TableCell>{ens.user?.email || '-'}</TableCell>
                                    <TableCell>{ens.specialite}</TableCell>
                                    <TableCell>{ens.departement}</TableCell>
                                    <TableCell>{ens.grade || '-'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleEdit(ens)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(ens.id_user)}>
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
                        <DialogTitle>{editing ? 'Modifier l\'enseignant' : 'Nouvel enseignant'}</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Utilisateur</InputLabel>
                                    <Select
                                        name="id_user"
                                        value={formik.values.id_user}
                                        onChange={formik.handleChange}
                                        label="Utilisateur"
                                        error={formik.touched.id_user && Boolean(formik.errors.id_user)}
                                    >
                                        {users.map((user) => (
                                            <MenuItem key={user.id_user} value={user.id_user}>
                                                {user.prenom} {user.nom} ({user.email})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    label="Spécialité"
                                    name="specialite"
                                    value={formik.values.specialite}
                                    onChange={formik.handleChange}
                                    error={formik.touched.specialite && Boolean(formik.errors.specialite)}
                                    helperText={formik.touched.specialite && formik.errors.specialite}
                                />
                                <TextField
                                    fullWidth
                                    label="Département"
                                    name="departement"
                                    value={formik.values.departement}
                                    onChange={formik.handleChange}
                                    error={formik.touched.departement && Boolean(formik.errors.departement)}
                                    helperText={formik.touched.departement && formik.errors.departement}
                                />
                                <TextField
                                    fullWidth
                                    label="Grade"
                                    name="grade"
                                    value={formik.values.grade}
                                    onChange={formik.handleChange}
                                />
                                <TextField
                                    fullWidth
                                    label="Bureau"
                                    name="bureau"
                                    value={formik.values.bureau}
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
                <Dialog open={importOpen} onClose={() => setImportOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Importer des enseignants</DialogTitle>
                    <DialogContent>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Format attendu : CSV ou Excel avec les colonnes suivantes :
                                <br />
                                <strong>nom, prenom, email, telephone, specialite, departement, grade, bureau</strong>
                                <br />
                                Les colonnes <strong>nom, prenom, email, specialite, departement</strong> sont obligatoires.
                            </Typography>
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        handleFileImport(file);
                                    }
                                }}
                                style={{ display: 'none' }}
                                id="import-file-enseignant"
                            />
                            <label htmlFor="import-file-enseignant">
                                <Button variant="outlined" component="span" fullWidth>
                                    Sélectionner un fichier
                                </Button>
                            </label>
                            {importLoading && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                    <CircularProgress />
                                </Box>
                            )}
                            {importErrors.length > 0 && (
                                <Box>
                                    <Typography variant="subtitle2" color="error" gutterBottom>
                                        Erreurs ({importErrors.length}) :
                                    </Typography>
                                    <List dense>
                                        {importErrors.slice(0, 10).map((err, idx) => (
                                            <ListItem key={idx}>
                                                <ListItemText primary={err} />
                                            </ListItem>
                                        ))}
                                        {importErrors.length > 10 && (
                                            <ListItem>
                                                <ListItemText primary={`... et ${importErrors.length - 10} autre(s) erreur(s)`} />
                                            </ListItem>
                                        )}
                                    </List>
                                </Box>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setImportOpen(false)}>Fermer</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </DashboardLayout>
    );
}

