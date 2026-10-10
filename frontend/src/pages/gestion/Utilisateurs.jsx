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
    Link,
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
import { Add, Edit, Delete, Search, ArrowBack, SupervisedUserCircle, PhonelinkErase } from '@mui/icons-material';
import { TableSortLabel } from '@mui/material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { userAPI } from '../../services/api';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import SkeletonTable from '../../components/common/SkeletonTable';
import EmptyState from '../../components/common/EmptyState';
import { useSortableTable } from '../../hooks/useSortableTable';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const validationSchema = yup.object({
    nom: yup.string().required('Le nom est requis'),
    prenom: yup.string().required('Le prénom est requis'),
    email: yup.string().email('Email invalide').required('L\'email est requis'),
    role: yup.string().oneOf(['admin', 'enseignant', 'etudiant']).required('Le rôle est requis'),
    telephone: yup.string(),
    // Longueur comme le serveur (utils/passwordHelper.js) ; mots de passe courants, personnels ou
    // divulgués : refusés par le serveur. Facultatif : sans mot de passe, le compte reçoit un lien
    // d'invitation ; un mot de passe saisi est provisoire.
    password: yup
        .string()
        .transform((valeur) => valeur || undefined)
        .min(12, 'Au moins 12 caractères (une phrase de passe convient)')
        .max(64, 'Au plus 64 caractères'),
});

export default function Utilisateurs() {
    const navigate = useNavigate();
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null });
    const [invitation, setInvitation] = useState(null);
    const { sorted: sortedUsers, requestSort, getSortDir } = useSortableTable(utilisateurs);

    useEffect(() => {
        loadUtilisateurs();
    }, [page, rowsPerPage]);

    const loadUtilisateurs = async () => {
        setLoading(true);
        try {
            const data = await userAPI.getAll({ page: page + 1, limit: rowsPerPage });
            setUtilisateurs(data.data || []);
            setTotal(data.pagination?.total || 0);
        } catch (err) {
            console.error('Erreur:', err);
            setError('Erreur lors du chargement des utilisateurs');
        } finally {
            setLoading(false);
        }
    };

    const formik = useFormik({
        initialValues: {
            nom: '',
            prenom: '',
            email: '',
            role: 'admin',
            telephone: '',
            password: '',
            actif: true,
            niveau: '',
        },
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError('');
                setSuccess('');
                const { niveau, ...dataToSend } = values;
                if (!dataToSend.password) {
                    delete dataToSend.password;
                }

                if (editing) {
                    await userAPI.update(editing.id_user, dataToSend);
                    setSuccess('Utilisateur modifié avec succès');
                } else {
                    // La fiche étudiant ou enseignant est créée avec le compte
                    const reponse = await userAPI.create({ ...dataToSend, ...(values.role === 'etudiant' && niveau ? { profil: { niveau } } : {}) });
                    if (reponse.invitation) setInvitation({ email: values.email, ...reponse.invitation });
                    setSuccess(reponse.invitation ? 'Compte créé : invitation envoyée' : 'Utilisateur créé : mot de passe provisoire à changer à la première connexion');
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
            niveau: user.niveau || '',
        });
        setOpen(true);
    };

    const handleDeleteClick = (id) => setConfirmDialog({ open: true, id });

    // Double authentification : téléphone perdu → retirée, sessions fermées, à reconfigurer
    const [mfaAReinitialiser, setMfaAReinitialiser] = useState(null);
    const reinitialiserMfa = async () => {
        const cible = mfaAReinitialiser;
        setMfaAReinitialiser(null);
        try {
            await userAPI.reinitialiserMfa(cible.id_user);
            setSuccess(`Double authentification de ${cible.prenom} ${cible.nom} réinitialisée`);
            loadUtilisateurs();
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Réinitialisation impossible');
        }
    };

    const handleDeleteConfirm = async () => {
        const { id } = confirmDialog;
        setConfirmDialog({ open: false, id: null });
        try {
            await userAPI.delete(id);
            setSuccess('Utilisateur supprimé avec succès');
            loadUtilisateurs();
        } catch (err) {
            console.error('Erreur:', err);
            setError('Erreur lors de la suppression');
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
                            Gestion des Utilisateurs
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
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
                            Ajouter un administrateur
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

                {loading ? (
                    <SkeletonTable columns={7} rows={rowsPerPage} />
                ) : utilisateurs.length === 0 ? (
                    <EmptyState
                        icon={SupervisedUserCircle}
                        title="Aucun utilisateur enregistré"
                        description="Les étudiants et les enseignants s'ajoutent dans leurs pages ; ici, les comptes administrateurs."
                        actionLabel="Ajouter un administrateur"
                        onAction={() => { setEditing(null); setError(''); formik.resetForm(); setOpen(true); }}
                    />
                ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><TableSortLabel active={getSortDir('nom') !== undefined} direction={getSortDir('nom') || 'asc'} onClick={() => requestSort('nom')}>Nom</TableSortLabel></TableCell>
                                <TableCell><TableSortLabel active={getSortDir('prenom') !== undefined} direction={getSortDir('prenom') || 'asc'} onClick={() => requestSort('prenom')}>Prénom</TableSortLabel></TableCell>
                                <TableCell><TableSortLabel active={getSortDir('email') !== undefined} direction={getSortDir('email') || 'asc'} onClick={() => requestSort('email')}>Email</TableSortLabel></TableCell>
                                <TableCell>Rôle</TableCell>
                                <TableCell>Téléphone</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sortedUsers.filter(u =>
                                u.nom?.toLowerCase().includes(search.toLowerCase()) ||
                                u.prenom?.toLowerCase().includes(search.toLowerCase()) ||
                                u.email?.toLowerCase().includes(search.toLowerCase())
                            ).map((user) => (
                                <TableRow key={user.id_user} hover>
                                    <TableCell>{user.nom}</TableCell>
                                    <TableCell>{user.prenom}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip label={user.role} size="small" color={user.role === 'admin' ? 'error' : user.role === 'enseignant' ? 'primary' : 'default'} />
                                    </TableCell>
                                    <TableCell>{user.telephone || '-'}</TableCell>
                                    <TableCell>
                                        <Chip label={user.actif ? 'Actif' : 'Inactif'} color={user.actif ? 'success' : 'default'} size="small" />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleEdit(user)} aria-label={`Modifier ${user.prenom} ${user.nom}`}>
                                            <Edit />
                                        </IconButton>
                                        {user.mfa_active && (
                                            <IconButton size="small" onClick={() => setMfaAReinitialiser(user)} aria-label={`Réinitialiser la double authentification de ${user.prenom} ${user.nom}`} title="Réinitialiser la double authentification">
                                                <PhonelinkErase />
                                            </IconButton>
                                        )}
                                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(user.id_user)} aria-label={`Supprimer ${user.prenom} ${user.nom}`}>
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
                )}

                <ConfirmDialog
                    open={confirmDialog.open}
                    title="Supprimer l'utilisateur"
                    message="Cette action est irréversible. L'utilisateur sera définitivement supprimé."
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmDialog({ open: false, id: null })}
                />

                <ConfirmDialog
                    open={Boolean(mfaAReinitialiser)}
                    title="Réinitialiser la double authentification"
                    message={`${mfaAReinitialiser?.prenom ?? ''} ${mfaAReinitialiser?.nom ?? ''} sera déconnecté partout et devra la configurer de nouveau (administrateur) ou pourra s'en passer (enseignant). À faire seulement après avoir vérifié son identité.`}
                    confirmLabel="Réinitialiser"
                    onConfirm={reinitialiserMfa}
                    onCancel={() => setMfaAReinitialiser(null)}
                />

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
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.email && Boolean(formik.errors.email)}
                                    helperText={formik.touched.email && formik.errors.email}
                                />
                                {!editing && (
                                    <Alert severity="info">
                                        Ce formulaire crée un compte administrateur. Les étudiants et les enseignants s'ajoutent, un par un ou par import, dans les pages{' '}
                                        <Link component={RouterLink} to="/gestion/etudiants">Étudiants</Link> et{' '}
                                        <Link component={RouterLink} to="/gestion/enseignants">Enseignants</Link>.
                                    </Alert>
                                )}
                                {/* Le rôle d'un compte existant ne change pas ici : son profil (étudiant, enseignant) en dépend */}
                                <FormControl fullWidth sx={{ display: editing ? undefined : 'none' }}>
                                    <InputLabel>Rôle</InputLabel>
                                    <Select
                                        name="role"
                                        value={formik.values.role}
                                        onChange={formik.handleChange}
                                        label="Rôle"
                                        disabled
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
                                    label={editing ? 'Nouveau mot de passe provisoire (laisser vide pour ne pas changer)' : 'Mot de passe provisoire (facultatif)'}
                                    name="password"
                                    type="password"
                                    value={formik.values.password}
                                    onChange={formik.handleChange}
                                    error={formik.touched.password && Boolean(formik.errors.password)}
                                    helperText={
                                        (formik.touched.password && formik.errors.password) ||
                                        (editing
                                            ? "L'utilisateur devra le changer à sa prochaine connexion"
                                            : "Sans mot de passe, un lien d'invitation lui est envoyé pour choisir le sien")
                                    }
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

                {/* Lien d'invitation : à transmettre si l'email n'a pas pu partir */}
                <Dialog open={Boolean(invitation)} onClose={() => setInvitation(null)} maxWidth="sm" fullWidth>
                    <DialogTitle>Invitation de {invitation?.email}</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {invitation?.envoyee
                                ? "Un email avec ce lien vient d'être envoyé. Vous pouvez aussi le transmettre vous-même ; il est valable 7 jours."
                                : "L'email n'a pas pu être envoyé : transmettez ce lien à la personne. Il est valable 7 jours."}
                        </Typography>
                        <TextField fullWidth value={invitation?.lien ?? ''} InputProps={{ readOnly: true }} onFocus={(e) => e.target.select()} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => navigator.clipboard?.writeText(invitation?.lien ?? '')}>Copier le lien</Button>
                        <Button variant="contained" onClick={() => setInvitation(null)}>Fermer</Button>
                    </DialogActions>
                </Dialog>

            </Box>
        </DashboardLayout>
    );
}

