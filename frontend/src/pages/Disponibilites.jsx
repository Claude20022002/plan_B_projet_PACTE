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
    Typography,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Switch,
    Alert,
    Snackbar,
    IconButton,
    Chip,
    CircularProgress,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { disponibiliteAPI, creneauAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useFormik } from 'formik';
import * as yup from 'yup';

const JOURS_ORDER = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const validationSchema = yup.object({
    id_creneau: yup.number()
        .min(1, 'Le créneau est requis')
        .required('Le créneau est requis'),
    date_debut: yup.string()
        .min(1, 'La date de début est requise')
        .required('La date de début est requise'),
    date_fin: yup.string()
        .min(1, 'La date de fin est requise')
        .required('La date de fin est requise'),
    disponible: yup.boolean(),
});

export default function Disponibilites() {
    const { user } = useAuth();
    const [disponibilites, setDisponibilites] = useState([]);
    const [creneaux, setCreneaux]             = useState([]);
    const [open, setOpen]                     = useState(false);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState('');
    const [success, setSuccess]               = useState('');

    useEffect(() => {
        if (user?.id_user) {
            Promise.all([loadDisponibilites(), loadCreneaux()]);
        }
    }, [user]);

    const loadCreneaux = async () => {
        try {
            const data = await creneauAPI.getAll({ limit: 200 });
            const list = data.data || data || [];
            // Trier par jour puis heure
            list.sort((a, b) => {
                const di = JOURS_ORDER.indexOf(a.jour_semaine) - JOURS_ORDER.indexOf(b.jour_semaine);
                return di !== 0 ? di : a.heure_debut.localeCompare(b.heure_debut);
            });
            setCreneaux(list);
        } catch (err) {
            console.error('Erreur chargement créneaux:', err);
        }
    };

    const loadDisponibilites = async () => {
        try {
            const data = await disponibiliteAPI.getByEnseignant(user.id_user);
            setDisponibilites(data.data || data || []);
        } catch (err) {
            console.error('Erreur:', err);
            setError('Erreur lors du chargement des disponibilités');
        } finally {
            setLoading(false);
        }
    };

    const formik = useFormik({
        initialValues: { id_creneau: '', date_debut: '', date_fin: '', disponible: true },
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError('');
                await disponibiliteAPI.create({
                    id_user_enseignant: user.id_user,
                    id_creneau:  Number(values.id_creneau),
                    date_debut:  values.date_debut,
                    date_fin:    values.date_fin,
                    disponible:  values.disponible,
                });
                setSuccess('Disponibilité ajoutée avec succès');
                formik.resetForm();
                setOpen(false);
                loadDisponibilites();
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Erreur lors de la création');
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cette disponibilité ?')) return;
        try {
            await disponibiliteAPI.delete(id);
            setSuccess('Disponibilité supprimée');
            loadDisponibilites();
        } catch (err) {
            setError('Erreur lors de la suppression');
        }
    };

    const handleOpen = () => {
        setError('');
        setSuccess('');
        formik.resetForm();
        setOpen(true);
    };

    return (
        <DashboardLayout>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Mes Disponibilités
                    </Typography>
                    <Button variant="contained" startIcon={<Add />} onClick={handleOpen}>
                        Ajouter une disponibilité
                    </Button>
                </Box>

                <Snackbar open={!!error}   autoHideDuration={6000} onClose={() => setError('')}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                    <Alert severity="error"   onClose={() => setError('')}   sx={{ width: '100%' }}>{error}</Alert>
                </Snackbar>
                <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                    <Alert severity="success" onClose={() => setSuccess('')} sx={{ width: '100%' }}>{success}</Alert>
                </Snackbar>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : disponibilites.length === 0 ? (
                    <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary">Aucune disponibilité enregistrée</Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                                    <TableCell>Jour</TableCell>
                                    <TableCell>Créneau</TableCell>
                                    <TableCell>Période</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell align="right">Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {disponibilites.map((disp) => (
                                    <TableRow key={disp.id_disponibilite} hover>
                                        <TableCell>
                                            {disp.creneau?.jour_semaine
                                                ? capitalize(disp.creneau.jour_semaine)
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {disp.creneau
                                                ? `${disp.creneau.heure_debut} – ${disp.creneau.heure_fin}`
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            {disp.date_debut
                                                ? new Date(disp.date_debut).toLocaleDateString('fr-FR')
                                                : '—'}
                                            {' → '}
                                            {disp.date_fin
                                                ? new Date(disp.date_fin).toLocaleDateString('fr-FR')
                                                : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={disp.disponible ? 'Disponible' : 'Indisponible'}
                                                size="small"
                                                color={disp.disponible ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" color="error"
                                                onClick={() => handleDelete(disp.id_disponibilite)}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* ── Dialog ajout disponibilité ──────────────────────────────── */}
                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                    <form onSubmit={formik.handleSubmit}>
                        <DialogTitle>Nouvelle disponibilité</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>

                                {/* Créneau — select depuis les créneaux existants */}
                                <FormControl
                                    fullWidth
                                    error={formik.touched.id_creneau && Boolean(formik.errors.id_creneau)}
                                >
                                    <InputLabel>Créneau (jour + horaire)</InputLabel>
                                    <Select
                                        name="id_creneau"
                                        value={formik.values.id_creneau}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        label="Créneau (jour + horaire)"
                                    >
                                        <MenuItem value=""><em>Sélectionner un créneau</em></MenuItem>
                                        {creneaux.length === 0 && (
                                            <MenuItem disabled>Chargement des créneaux…</MenuItem>
                                        )}
                                        {JOURS_ORDER.map((jour) => {
                                            const slots = creneaux.filter(c => c.jour_semaine === jour);
                                            if (!slots.length) return null;
                                            return [
                                                <MenuItem key={`hdr-${jour}`} disabled
                                                    sx={{ fontSize: 11, fontWeight: 'bold', opacity: 0.6, py: 0.5 }}>
                                                    ── {capitalize(jour)} ──
                                                </MenuItem>,
                                                ...slots.map(c => (
                                                    <MenuItem key={c.id_creneau} value={c.id_creneau}>
                                                        {capitalize(c.jour_semaine)} &nbsp;·&nbsp;
                                                        {c.heure_debut} – {c.heure_fin}
                                                        &nbsp;
                                                        <Typography component="span" variant="caption"
                                                            color="text.secondary">
                                                            ({c.duree_minutes} min)
                                                        </Typography>
                                                    </MenuItem>
                                                )),
                                            ];
                                        })}
                                    </Select>
                                    {formik.touched.id_creneau && formik.errors.id_creneau && (
                                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                            {formik.errors.id_creneau}
                                        </Typography>
                                    )}
                                </FormControl>

                                <TextField
                                    fullWidth
                                    label="Date de début de validité"
                                    name="date_debut"
                                    type="date"
                                    value={formik.values.date_debut}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    InputLabelProps={{ shrink: true }}
                                    error={formik.touched.date_debut && Boolean(formik.errors.date_debut)}
                                    helperText={formik.touched.date_debut && formik.errors.date_debut}
                                />

                                <TextField
                                    fullWidth
                                    label="Date de fin de validité"
                                    name="date_fin"
                                    type="date"
                                    value={formik.values.date_fin}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    InputLabelProps={{ shrink: true }}
                                    error={formik.touched.date_fin && Boolean(formik.errors.date_fin)}
                                    helperText={formik.touched.date_fin && formik.errors.date_fin}
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            name="disponible"
                                            checked={formik.values.disponible}
                                            onChange={formik.handleChange}
                                            color="success"
                                        />
                                    }
                                    label={formik.values.disponible ? 'Disponible' : 'Indisponible'}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpen(false)}>Annuler</Button>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={formik.isSubmitting}
                                startIcon={formik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
                            >
                                {formik.isSubmitting ? 'Enregistrement…' : 'Ajouter'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Box>
        </DashboardLayout>
    );
}
