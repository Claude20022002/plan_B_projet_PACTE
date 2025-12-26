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
import { etudiantAPI, userAPI, groupeAPI } from '../../services/api';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { parseFile, validateEtudiantData } from '../../utils/fileImport';
import { List, ListItem, ListItemText, CircularProgress } from '@mui/material';

const validationSchema = yup.object({
    id_user: yup.number().required('L\'utilisateur est requis'),
    numero_etudiant: yup.string().required('Le numéro étudiant est requis'),
    niveau: yup.string().required('Le niveau est requis'),
    id_groupe: yup.number().required('Le groupe est requis'),
});

export default function Etudiants() {
    const [etudiants, setEtudiants] = useState([]);
    const [users, setUsers] = useState([]);
    const [groupes, setGroupes] = useState([]);
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
        loadEtudiants();
        loadUsers();
        loadGroupes();
    }, [page, rowsPerPage]);

    const loadUsers = async () => {
        try {
            const data = await userAPI.getAll({ limit: 1000 });
            const etudiantsUsers = (data.data || []).filter((u) => u.role === 'etudiant');
            setUsers(etudiantsUsers);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const loadGroupes = async () => {
        try {
            const data = await groupeAPI.getAll({ limit: 1000 });
            setGroupes(data.data || []);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const loadEtudiants = async () => {
        try {
            const data = await etudiantAPI.getAll({
                page: page + 1,
                limit: rowsPerPage,
            });
            setEtudiants(data.data || []);
            setTotal(data.pagination?.total || 0);
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors du chargement des étudiants');
        }
    };

    const formik = useFormik({
        initialValues: {
            id_user: '',
            numero_etudiant: '',
            niveau: '',
            id_groupe: '',
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError('');
                setSuccess('');
                if (editing) {
                    await etudiantAPI.update(editing.id_user, values);
                    setSuccess('Étudiant modifié avec succès');
                } else {
                    await etudiantAPI.create(values);
                    setSuccess('Étudiant créé avec succès');
                }
                formik.resetForm();
                setOpen(false);
                setEditing(null);
                loadEtudiants();
                loadUsers();
            } catch (error) {
                console.error('Erreur:', error);
                setError(error.message || 'Erreur lors de la sauvegarde');
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleEdit = (etudiant) => {
        setEditing(etudiant);
        formik.setValues({
            id_user: etudiant.id_user,
            numero_etudiant: etudiant.numero_etudiant,
            niveau: etudiant.niveau,
            id_groupe: etudiant.id_groupe,
        });
        setOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) {
            try {
                await etudiantAPI.delete(id);
                setSuccess('Étudiant supprimé avec succès');
                loadEtudiants();
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
            const validation = validateEtudiantData(data);
            
            if (!validation.valid) {
                setImportErrors(validation.errors);
                setError('Le fichier contient des erreurs. Veuillez les corriger avant de continuer.');
                return;
            }

            // Préparer les données pour l'import
            const etudiantsToImport = data.map((row) => ({
                nom: row.nom?.trim() || '',
                prenom: row.prenom?.trim() || '',
                email: row.email?.trim().toLowerCase() || '',
                telephone: row.telephone?.trim() || '',
                numero_etudiant: row.numero_etudiant?.trim() || '',
                niveau: row.niveau?.trim() || '',
                id_groupe: row.id_groupe ? Number(row.id_groupe) : null,
                actif: row.actif !== undefined ? row.actif : true,
            }));

            const result = await etudiantAPI.importEtudiants(etudiantsToImport);
            setSuccess(`${result.successCount || result.success?.length || 0} étudiant(s) importé(s) avec succès`);
            if (result.errors && result.errors.length > 0) {
                setImportErrors(result.errors.map(e => e.error || e.message || 'Erreur inconnue'));
            }
            setImportOpen(false);
            loadEtudiants();
            loadUsers();
            loadGroupes();
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            setError(error.message || 'Erreur lors de l\'import du fichier');
        } finally {
            setImportLoading(false);
        }
    };

    const filteredEtudiants = etudiants.filter(
        (etu) =>
            etu.user?.nom?.toLowerCase().includes(search.toLowerCase()) ||
            etu.user?.prenom?.toLowerCase().includes(search.toLowerCase()) ||
            etu.numero_etudiant?.toLowerCase().includes(search.toLowerCase())
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
                            Gestion des Étudiants
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
                            Ajouter un étudiant
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
                            placeholder="Rechercher un étudiant..."
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
                                <TableCell>Numéro</TableCell>
                                <TableCell>Nom</TableCell>
                                <TableCell>Prénom</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Niveau</TableCell>
                                <TableCell>Groupe</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredEtudiants.map((etu) => (
                                <TableRow key={etu.id_user}>
                                    <TableCell>{etu.numero_etudiant}</TableCell>
                                    <TableCell>{etu.user?.nom || '-'}</TableCell>
                                    <TableCell>{etu.user?.prenom || '-'}</TableCell>
                                    <TableCell>{etu.user?.email || '-'}</TableCell>
                                    <TableCell>{etu.niveau}</TableCell>
                                    <TableCell>{etu.groupe?.nom_groupe || '-'}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleEdit(etu)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(etu.id_user)}>
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
                        <DialogTitle>{editing ? 'Modifier l\'étudiant' : 'Nouvel étudiant'}</DialogTitle>
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
                                    label="Numéro étudiant"
                                    name="numero_etudiant"
                                    value={formik.values.numero_etudiant}
                                    onChange={formik.handleChange}
                                    error={formik.touched.numero_etudiant && Boolean(formik.errors.numero_etudiant)}
                                    helperText={formik.touched.numero_etudiant && formik.errors.numero_etudiant}
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
                                <FormControl fullWidth>
                                    <InputLabel>Groupe</InputLabel>
                                    <Select
                                        name="id_groupe"
                                        value={formik.values.id_groupe}
                                        onChange={formik.handleChange}
                                        label="Groupe"
                                        error={formik.touched.id_groupe && Boolean(formik.errors.id_groupe)}
                                    >
                                        {groupes.map((groupe) => (
                                            <MenuItem key={groupe.id_groupe} value={groupe.id_groupe}>
                                                {groupe.nom_groupe}
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

