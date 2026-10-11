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
import { Add, Edit, Delete, Search, UploadFile, ArrowBack, Download } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { etudiantAPI, userAPI, groupeAPI } from '../../services/api';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import ImportCsvDialog from '../../components/common/ImportCsvDialog';
import { exportToExcelLazy } from '../../utils/lazyExports';
import { COLS_ETUDIANTS } from '../../utils/exportColumns';
import { List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { useTranslation } from 'react-i18next';

// Modèle d'import : le groupe par son nom (celui affiché dans Groupes), pas par son identifiant
const MODELE_CSV = [
    'nom;prenom;email;telephone;numero_etudiant;niveau;groupe',
    'EXEMPLE;Amine;amine.exemple@exemple.hestim.test;;E2026001;3A;IIIA-3A-TD1',
].join('\n');

const validationSchema = yup.object({
    // Messages : des clés de traduction, traduites à l'affichage
    id_user: yup.number().required('etudiants.erreurs.utilisateur'),
    numero_etudiant: yup.string().required('etudiants.erreurs.numero'),
    niveau: yup.string().required('etudiants.erreurs.niveau'),
    id_groupe: yup.number().required('etudiants.erreurs.groupe'),
});

/** Gestion des étudiants (administration) : liste, fiche, import et export. */
export default function Etudiants() {
    const { t } = useTranslation();
    const confirmer = useConfirmation();
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
    const [importOuvert, setImportOuvert] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadEtudiants();
        loadUsers();
        loadGroupes();
    }, [page, rowsPerPage]);

    const loadUsers = async () => {
        try {
            const data = await userAPI.getTous();
            const etudiantsUsers = data.filter((u) => u.role === 'etudiant');
            setUsers(etudiantsUsers);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const loadGroupes = async () => {
        try {
            const data = await groupeAPI.getTous();
            setGroupes(data);
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
            setError(t('etudiants.erreurChargement'));
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
                    setSuccess(t('etudiants.modifie'));
                } else {
                    await etudiantAPI.create(values);
                    setSuccess(t('etudiants.cree'));
                }
                formik.resetForm();
                setOpen(false);
                setEditing(null);
                loadEtudiants();
                loadUsers();
            } catch (error) {
                console.error('Erreur:', error);
                setError(error.message || t('etudiants.erreurSauvegarde'));
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
        if (!(await confirmer(t('etudiants.confirmerSuppression')))) return;
        try {
            await etudiantAPI.delete(id);
            setSuccess(t('etudiants.supprime'));
            loadEtudiants();
        } catch (error) {
            console.error('Erreur:', error);
            setError(t('etudiants.erreurSuppression'));
        }
    };

    // Groupe désigné par son nom (casse et espaces ignorés) ; l'import serveur traite le reste du
    // fichier et ses erreurs (par email) sont ramenées aux lignes
    const importer = async (lignes) => {
        const parNom = new Map(groupes.map((g) => [String(g.nom_groupe).trim().toLowerCase(), g.id_groupe]));
        const erreurs = [];
        const valides = [];
        lignes.forEach((l, index) => {
            const propre = Object.fromEntries(Object.entries(l).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
            const nomGroupe = String(propre.groupe ?? '').toLowerCase();
            if (nomGroupe && !parNom.has(nomGroupe)) {
                erreurs.push({ ligne: index + 2, libelle: propre.email, message: t('etudiants.groupeInconnu', { groupe: propre.groupe }) });
                return;
            }
            valides.push({ ...propre, email: String(propre.email ?? '').toLowerCase(), id_groupe: nomGroupe ? parNom.get(nomGroupe) : null });
        });
        if (valides.length) {
            const reponse = await etudiantAPI.importEtudiants(valides);
            const ligneDe = (email) => lignes.findIndex((l) => String(l.email || '').trim().toLowerCase() === String(email || '').toLowerCase()) + 2;
            erreurs.push(...(reponse.errors || []).map((e) => ({ ligne: ligneDe(e.email), libelle: e.email, message: e.error || e.message })));
            loadEtudiants();
            loadUsers();
            return { reussies: reponse.successCount ?? reponse.success?.length ?? 0, erreurs };
        }
        return { reussies: 0, erreurs };
    };

    const handleExport = async () => {
        try {
            const data = await etudiantAPI.getTous();
            await exportToExcelLazy(data, COLS_ETUDIANTS, 'Etudiants', t('etudiants.fichierExport'));
        } catch { setError(t('etudiants.erreurExport')); }
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
                            {t('common.back')}
                        </Button>
                        <Typography variant="h5" fontWeight="bold">
                            {t('etudiants.titre')}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<UploadFile />}
                            onClick={() => setImportOuvert(true)}
                        >
                            {t('etudiants.importer')}
                        </Button>
                        <Button variant="outlined" startIcon={<Download />} onClick={handleExport} size="small">
                            {t('etudiants.exporter')}
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
                            {t('etudiants.ajouter')}
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
                            placeholder={t('etudiants.rechercher')}
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
                                <TableCell>{t('etudiants.colonnes.numero')}</TableCell>
                                <TableCell>{t('etudiants.colonnes.nom')}</TableCell>
                                <TableCell>{t('etudiants.colonnes.prenom')}</TableCell>
                                <TableCell>{t('etudiants.colonnes.email')}</TableCell>
                                <TableCell>{t('etudiants.colonnes.niveau')}</TableCell>
                                <TableCell>{t('etudiants.colonnes.groupe')}</TableCell>
                                <TableCell align="right">{t('etudiants.colonnes.actions')}</TableCell>
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
                                        <IconButton size="small" onClick={() => handleEdit(etu)} aria-label={t('etudiants.modifier')}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDelete(etu.id_user)} aria-label={t('common.delete')}>
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
                        <DialogTitle>{t(editing ? 'etudiants.titreModifier' : 'etudiants.titreNouveau')}</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <FormControl fullWidth>
                                    <InputLabel>{t('etudiants.champs.utilisateur')}</InputLabel>
                                    <Select
                                        name="id_user"
                                        value={formik.values.id_user}
                                        onChange={formik.handleChange}
                                        label={t('etudiants.champs.utilisateur')}
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
                                    label={t('etudiants.champs.numero')}
                                    name="numero_etudiant"
                                    value={formik.values.numero_etudiant}
                                    onChange={formik.handleChange}
                                    error={formik.touched.numero_etudiant && Boolean(formik.errors.numero_etudiant)}
                                    helperText={formik.touched.numero_etudiant && formik.errors.numero_etudiant && t(formik.errors.numero_etudiant)}
                                />
                                <TextField
                                    fullWidth
                                    label={t('etudiants.colonnes.niveau')}
                                    name="niveau"
                                    value={formik.values.niveau}
                                    onChange={formik.handleChange}
                                    error={formik.touched.niveau && Boolean(formik.errors.niveau)}
                                    helperText={formik.touched.niveau && formik.errors.niveau && t(formik.errors.niveau)}
                                />
                                <FormControl fullWidth>
                                    <InputLabel>{t('etudiants.colonnes.groupe')}</InputLabel>
                                    <Select
                                        name="id_groupe"
                                        value={formik.values.id_groupe}
                                        onChange={formik.handleChange}
                                        label={t('etudiants.colonnes.groupe')}
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
                            <Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                            <Button type="submit" variant="contained">
                                {t(editing ? 'etudiants.modifier' : 'etudiants.creer')}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Box>
            <ImportCsvDialog
                open={importOuvert}
                onClose={() => setImportOuvert(false)}
                titre={t('etudiants.titreImport')}
                intro={t('etudiants.introImport')}
                modele={MODELE_CSV}
                nomModele="modele-etudiants.csv"
                onImport={importer}
            />
        </DashboardLayout>
    );
}

