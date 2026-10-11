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
import { useTranslation } from 'react-i18next';

const validationSchema = yup.object({
    // Messages : des clés de traduction, traduites à l'affichage
    nom: yup.string().required('utilisateurs.erreurs.nom'),
    prenom: yup.string().required('utilisateurs.erreurs.prenom'),
    email: yup.string().email('utilisateurs.erreurs.emailInvalide').required('utilisateurs.erreurs.email'),
    role: yup.string().oneOf(['admin', 'enseignant', 'etudiant']).required('utilisateurs.erreurs.role'),
    telephone: yup.string(),
    // Longueur comme le serveur (utils/passwordHelper.js) ; mots de passe courants, personnels ou
    // divulgués : refusés par le serveur. Facultatif : sans mot de passe, le compte reçoit un lien
    // d'invitation ; un mot de passe saisi est provisoire.
    password: yup
        .string()
        .transform((valeur) => valeur || undefined)
        .min(12, 'utilisateurs.erreurs.motDePasseCourt')
        .max(64, 'utilisateurs.erreurs.motDePasseLong'),
});

/** Comptes (administration) : liste de tous les comptes, création des comptes administrateurs. */
export default function Utilisateurs() {
    const { t } = useTranslation();
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
            setError(t('utilisateurs.erreurChargement'));
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
                    setSuccess(t('utilisateurs.modifie'));
                } else {
                    // La fiche étudiant ou enseignant est créée avec le compte
                    const reponse = await userAPI.create({ ...dataToSend, ...(values.role === 'etudiant' && niveau ? { profil: { niveau } } : {}) });
                    if (reponse.invitation) setInvitation({ email: values.email, ...reponse.invitation });
                    setSuccess(t(reponse.invitation ? 'utilisateurs.creeInvitation' : 'utilisateurs.creeProvisoire'));
                }
                formik.resetForm();
                setOpen(false);
                setEditing(null);
                loadUtilisateurs();
            } catch (error) {
                console.error('Erreur:', error);
                setError(error.message || t('utilisateurs.erreurSauvegarde'));
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
            setSuccess(t('utilisateurs.mfaReinitialisee', { nom: `${cible.prenom} ${cible.nom}` }));
            loadUtilisateurs();
        } catch (err) {
            setError(err.response?.data?.error || err.message || t('utilisateurs.mfaErreur'));
        }
    };

    const handleDeleteConfirm = async () => {
        const { id } = confirmDialog;
        setConfirmDialog({ open: false, id: null });
        try {
            await userAPI.delete(id);
            setSuccess(t('utilisateurs.supprime'));
            loadUtilisateurs();
        } catch (err) {
            console.error('Erreur:', err);
            setError(t('utilisateurs.erreurSuppression'));
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
                            {t('common.back')}
                        </Button>
                        <Typography variant="h5" fontWeight="bold">
                            {t('utilisateurs.titre')}
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
                            {t('utilisateurs.ajouter')}
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
                            placeholder={t('utilisateurs.rechercher')}
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
                        title={t('utilisateurs.vide')}
                        description={t('utilisateurs.videAide')}
                        actionLabel={t('utilisateurs.ajouter')}
                        onAction={() => { setEditing(null); setError(''); formik.resetForm(); setOpen(true); }}
                    />
                ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><TableSortLabel active={getSortDir('nom') !== undefined} direction={getSortDir('nom') || 'asc'} onClick={() => requestSort('nom')}>{t('utilisateurs.colonnes.nom')}</TableSortLabel></TableCell>
                                <TableCell><TableSortLabel active={getSortDir('prenom') !== undefined} direction={getSortDir('prenom') || 'asc'} onClick={() => requestSort('prenom')}>{t('utilisateurs.colonnes.prenom')}</TableSortLabel></TableCell>
                                <TableCell><TableSortLabel active={getSortDir('email') !== undefined} direction={getSortDir('email') || 'asc'} onClick={() => requestSort('email')}>{t('utilisateurs.colonnes.email')}</TableSortLabel></TableCell>
                                <TableCell>{t('utilisateurs.colonnes.role')}</TableCell>
                                <TableCell>{t('utilisateurs.colonnes.telephone')}</TableCell>
                                <TableCell>{t('utilisateurs.colonnes.statut')}</TableCell>
                                <TableCell align="right">{t('utilisateurs.colonnes.actions')}</TableCell>
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
                                        <Chip label={t(`roles.${user.role}`, { defaultValue: user.role })} size="small" color={user.role === 'admin' ? 'error' : user.role === 'enseignant' ? 'primary' : 'default'} />
                                    </TableCell>
                                    <TableCell>{user.telephone || '-'}</TableCell>
                                    <TableCell>
                                        <Chip label={t(user.actif ? 'utilisateurs.actif' : 'utilisateurs.inactif')} color={user.actif ? 'success' : 'default'} size="small" />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={() => handleEdit(user)} aria-label={t('utilisateurs.modifierNom', { nom: `${user.prenom} ${user.nom}` })}>
                                            <Edit />
                                        </IconButton>
                                        {user.mfa_active && (
                                            <IconButton size="small" onClick={() => setMfaAReinitialiser(user)} aria-label={t('utilisateurs.mfaNom', { nom: `${user.prenom} ${user.nom}` })} title={t('utilisateurs.mfaTitre')}>
                                                <PhonelinkErase />
                                            </IconButton>
                                        )}
                                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(user.id_user)} aria-label={t('utilisateurs.supprimerNom', { nom: `${user.prenom} ${user.nom}` })}>
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
                    title={t('utilisateurs.titreSuppression')}
                    message={t('utilisateurs.messageSuppression')}
                    confirmLabel={t('common.delete')}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setConfirmDialog({ open: false, id: null })}
                />

                <ConfirmDialog
                    open={Boolean(mfaAReinitialiser)}
                    title={t('utilisateurs.mfaTitre')}
                    message={t('utilisateurs.mfaMessage', { nom: `${mfaAReinitialiser?.prenom ?? ''} ${mfaAReinitialiser?.nom ?? ''}` })}
                    confirmLabel={t('utilisateurs.reinitialiser')}
                    onConfirm={reinitialiserMfa}
                    onCancel={() => setMfaAReinitialiser(null)}
                />

                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                    <form onSubmit={formik.handleSubmit}>
                        <DialogTitle>{t(editing ? 'utilisateurs.titreModifier' : 'utilisateurs.titreNouveau')}</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <TextField
                                    fullWidth
                                    label={t('utilisateurs.colonnes.nom')}
                                    name="nom"
                                    value={formik.values.nom}
                                    onChange={formik.handleChange}
                                    error={formik.touched.nom && Boolean(formik.errors.nom)}
                                    helperText={formik.touched.nom && formik.errors.nom && t(formik.errors.nom)}
                                />
                                <TextField
                                    fullWidth
                                    label={t('utilisateurs.colonnes.prenom')}
                                    name="prenom"
                                    value={formik.values.prenom}
                                    onChange={formik.handleChange}
                                    error={formik.touched.prenom && Boolean(formik.errors.prenom)}
                                    helperText={formik.touched.prenom && formik.errors.prenom && t(formik.errors.prenom)}
                                />
                                <TextField
                                    fullWidth
                                    label={t('utilisateurs.colonnes.email')}
                                    name="email"
                                    type="email"
                                    value={formik.values.email}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.email && Boolean(formik.errors.email)}
                                    helperText={formik.touched.email && formik.errors.email && t(formik.errors.email)}
                                />
                                {!editing && (
                                    <Alert severity="info">
                                        {t('utilisateurs.infoAdmin')}{' '}
                                        <Link component={RouterLink} to="/gestion/etudiants">{t('utilisateurs.pageEtudiants')}</Link> {t('utilisateurs.et')}{' '}
                                        <Link component={RouterLink} to="/gestion/enseignants">{t('utilisateurs.pageEnseignants')}</Link>.
                                    </Alert>
                                )}
                                {/* Le rôle d'un compte existant ne change pas ici : son profil (étudiant, enseignant) en dépend */}
                                <FormControl fullWidth sx={{ display: editing ? undefined : 'none' }}>
                                    <InputLabel>{t('utilisateurs.colonnes.role')}</InputLabel>
                                    <Select
                                        name="role"
                                        value={formik.values.role}
                                        onChange={formik.handleChange}
                                        label={t('utilisateurs.colonnes.role')}
                                        disabled
                                    >
                                        <MenuItem value="admin">{t('roles.admin')}</MenuItem>
                                        <MenuItem value="enseignant">{t('roles.enseignant')}</MenuItem>
                                        <MenuItem value="etudiant">{t('roles.etudiant')}</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    fullWidth
                                    label={t('utilisateurs.colonnes.telephone')}
                                    name="telephone"
                                    value={formik.values.telephone}
                                    onChange={formik.handleChange}
                                />
                                <TextField
                                    fullWidth
                                    label={t(editing ? 'utilisateurs.motDePasseModifier' : 'utilisateurs.motDePasseNouveau')}
                                    name="password"
                                    type="password"
                                    value={formik.values.password}
                                    onChange={formik.handleChange}
                                    error={formik.touched.password && Boolean(formik.errors.password)}
                                    helperText={
                                        (formik.touched.password && formik.errors.password && t(formik.errors.password)) ||
                                        t(editing ? 'utilisateurs.motDePasseAideModifier' : 'utilisateurs.motDePasseAideNouveau')
                                    }
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                            <Button type="submit" variant="contained">
                                {t(editing ? 'utilisateurs.modifier' : 'utilisateurs.creer')}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>

                {/* Lien d'invitation : à transmettre si l'email n'a pas pu partir */}
                <Dialog open={Boolean(invitation)} onClose={() => setInvitation(null)} maxWidth="sm" fullWidth>
                    <DialogTitle>{t('utilisateurs.invitationDe', { email: invitation?.email })}</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {t(invitation?.envoyee ? 'utilisateurs.invitationEnvoyee' : 'utilisateurs.invitationNonEnvoyee')}
                        </Typography>
                        <TextField fullWidth value={invitation?.lien ?? ''} InputProps={{ readOnly: true }} onFocus={(e) => e.target.select()} />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => navigator.clipboard?.writeText(invitation?.lien ?? '')}>{t('utilisateurs.copierLien')}</Button>
                        <Button variant="contained" onClick={() => setInvitation(null)}>{t('common.close')}</Button>
                    </DialogActions>
                </Dialog>

            </Box>
        </DashboardLayout>
    );
}

