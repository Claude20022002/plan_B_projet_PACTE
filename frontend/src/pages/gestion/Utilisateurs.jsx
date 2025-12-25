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
    Alert,
    Snackbar,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete, Search, ArrowBack, UploadFile } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { userAPI } from '../../services/api';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { parseFile, validateUserData } from '../../utils/fileImport';

const validationSchema = yup.object({
    nom: yup.string().required('Le nom est requis'),
    prenom: yup.string().required('Le prénom est requis'),
    email: yup.string().email('Email invalide').required('L\'email est requis'),
    role: yup.string().oneOf(['admin', 'enseignant', 'etudiant']).required('Le rôle est requis'),
    telephone: yup.string(),
    password: yup.string().when('editing', {
        is: false,
        then: (schema) => schema.min(6, 'Le mot de passe doit contenir au moins 6 caractères').required('Le mot de passe est requis'),
        otherwise: (schema) => schema.min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    }),
});

export default function Utilisateurs() {
    const navigate = useNavigate();
    const [utilisateurs, setUtilisateurs] = useState([]);
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
        loadUtilisateurs();
    }, [page, rowsPerPage]);

    const loadUtilisateurs = async () => {
        try {
            const data = await userAPI.getAll({
                page: page + 1,
                limit: rowsPerPage,
            });
            setUtilisateurs(data.data || []);
            setTotal(data.pagination?.total || 0);
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors du chargement des utilisateurs');
        }
    };

    const formik = useFormik({
        initialValues: {
            nom: '',
            prenom: '',
            email: '',
            role: 'etudiant',
            telephone: '',
            password: '',
            actif: true,
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError('');
                setSuccess('');
                const dataToSend = { ...values };
                if (editing && !dataToSend.password) {
                    delete dataToSend.password;
                }

                if (editing) {
                    await userAPI.update(editing.id_user, dataToSend);
                    setSuccess('Utilisateur modifié avec succès');
                } else {
                    await userAPI.create(dataToSend);
                    setSuccess('Utilisateur créé avec succès');
                }
                formik.resetForm();
                setOpen(false);
                setEditing(null);
                loadUtilisateurs();
            } catch (error) {
                console.error('Erreur:', error);
                setError(error.message || 'Erreur lors de la sauvegarde');
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleEdit = (user) => {
        setEditing(user);
        formik.setValues({
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role,
            telephone: user.telephone || '',
            password: '',
            actif: user.actif,
        });
        setOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            try {
                await userAPI.delete(id);
                setSuccess('Utilisateur supprimé avec succès');
                loadUtilisateurs();
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
            const validation = validateUserData(data);
            
            if (!validation.valid) {
                setImportErrors(validation.errors);
                setError('Le fichier contient des erreurs. Veuillez les corriger avant de continuer.');
                return;
            }

            // Préparer les données pour l'import
            const usersToImport = data.map((row) => ({
                nom: row.nom?.trim(),
                prenom: row.prenom?.trim(),
                email: row.email?.trim().toLowerCase(),
                role: row.role?.trim().toLowerCase(),
                telephone: row.telephone?.trim() || '',
                password: row.password?.trim() || 'password123', // Mot de passe par défaut
                actif: row.actif !== undefined ? row.actif : true,
            }));

            await userAPI.importBulk({ users: usersToImport });
            setSuccess(`${usersToImport.length} utilisateur(s) importé(s) avec succès`);
            setImportOpen(false);
            loadUtilisateurs();
        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            setError(error.message || 'Erreur lors de l\'import du fichier');
        } finally {
            setImportLoading(false);
        }
    };

    const filteredUsers = utilisateurs.filter(
        (user) =>
            user.nom?.toLowerCase().includes(search.toLowerCase()) ||
            user.prenom?.toLowerCase().includes(search.toLowerCase()) ||
            user.email?.toLowerCase().includes(search.toLowerCase())
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
                            Gestion des Utilisateurs
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
                            Ajouter un utilisateur
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
                            placeholder="Rechercher un utilisateur..."
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
                                <TableCell>Rôle</TableCell>
                                <TableCell>Téléphone</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.id_user}>
                                    <TableCell>{user.nom}</TableCell>
                                    <TableCell>{user.prenom}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.role}
                                            size="small"
                                            color={
                                                user.role === 'admin'
                                                    ? 'error'
                                                    : user.role === 'enseignant'
                                                      ? 'primary'
                                                      : 'default'
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>{user.telephone || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.actif ? 'Actif' : 'Inactif'}
                                            color={user.actif ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleEdit(user)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(user.id_user)}>
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
                        <DialogTitle>{editing ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <TextField
                                    fullWidth
                                    label="Nom"
                                    name="nom"
                                    value={formik.values.nom}
                                    onChange={formik.handleChange}
                                    error={formik.touched.nom && Boolean(formik.errors.nom)}
                                    helperText={formik.touched.nom && formik.errors.nom}
                                />
                                <TextField
                                    fullWidth
                                    label="Prénom"
                                    name="prenom"
                                    value={formik.values.prenom}
                                    onChange={formik.handleChange}
                                    error={formik.touched.prenom && Boolean(formik.errors.prenom)}
                                    helperText={formik.touched.prenom && formik.errors.prenom}
                                />
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formik.values.email}
                                    onChange={formik.handleChange}
                                    error={formik.touched.email && Boolean(formik.errors.email)}
                                    helperText={formik.touched.email && formik.errors.email}
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Rôle</InputLabel>
                                    <Select
                                        name="role"
                                        value={formik.values.role}
                                        onChange={formik.handleChange}
                                        label="Rôle"
                                    >
                                        <MenuItem value="admin">Administrateur</MenuItem>
                                        <MenuItem value="enseignant">Enseignant</MenuItem>
                                        <MenuItem value="etudiant">Étudiant</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    label="Téléphone"
                                    name="telephone"
                                    value={formik.values.telephone}
                                    onChange={formik.handleChange}
                                />
                                <TextField
                                    fullWidth
                                    label={editing ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
                                    name="password"
                                    type="password"
                                    value={formik.values.password}
                                    onChange={formik.handleChange}
                                    error={formik.touched.password && Boolean(formik.errors.password)}
                                    helperText={formik.touched.password && formik.errors.password}
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
                    <DialogTitle>Importer des utilisateurs (Excel/CSV)</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                <Typography variant="body2" gutterBottom>
                                    <strong>Format du fichier requis :</strong>
                                </Typography>
                                <Typography variant="body2" component="div">
                                    Les colonnes requises sont : <strong>nom</strong>, <strong>prenom</strong>, <strong>email</strong>, <strong>role</strong>
                                </Typography>
                                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                                    Colonnes optionnelles : <strong>telephone</strong>, <strong>password</strong>, <strong>actif</strong>
                                </Typography>
                                <Typography variant="body2" component="div" sx={{ mt: 1 }}>
                                    Les rôles acceptés sont : <strong>admin</strong>, <strong>enseignant</strong>, <strong>etudiant</strong>
                                </Typography>
                            </Alert>
                            
                            <input
                                accept=".csv,.xlsx,.xls"
                                style={{ display: 'none' }}
                                id="import-file-input"
                                type="file"
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        handleFileImport(file);
                                    }
                                }}
                            />
                            <label htmlFor="import-file-input">
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

