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
    Alert,
    Snackbar,
    IconButton,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { disponibiliteAPI, creneauAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useFormik } from 'formik';
import * as yup from 'yup';

const validationSchema = yup.object({
    jour_semaine: yup.string().required('Le jour est requis'),
    heure_debut: yup.string().required('L\'heure de début est requise'),
    heure_fin: yup.string().required('L\'heure de fin est requise'),
    date_debut: yup.string().required('La date de début est requise'),
    date_fin: yup.string().required('La date de fin est requise'),
    disponible: yup.boolean(),
});

export default function Disponibilites() {
    const { user } = useAuth();
    const [disponibilites, setDisponibilites] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user?.id_user) {
            loadDisponibilites();
        }
    }, [user]);

    const loadDisponibilites = async () => {
        try {
            const data = await disponibiliteAPI.getByEnseignant(user.id_user);
            setDisponibilites(data.data || data || []);
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors du chargement des disponibilités');
        } finally {
            setLoading(false);
        }
    };

    const formik = useFormik({
        initialValues: {
            jour_semaine: '',
            heure_debut: '',
            heure_fin: '',
            date_debut: '',
            date_fin: '',
            disponible: true,
        },
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError('');
                setSuccess('');
                
                // Trouver ou créer le créneau
                let creneau;
                try {
                    // Chercher un créneau existant
                    const creneaux = await creneauAPI.getAll({
                        jour_semaine: values.jour_semaine,
                    });
                    const existingCreneau = (creneaux.data || []).find(
                        (c) => c.heure_debut === values.heure_debut && c.heure_fin === values.heure_fin
                    );
                    
                    if (existingCreneau) {
                        creneau = existingCreneau;
                    } else {
                        // Créer un nouveau créneau
                        const duree = Math.round(
                            (new Date(`2000-01-01T${values.heure_fin}`) - new Date(`2000-01-01T${values.heure_debut}`)) / 60000
                        );
                        const creneauResponse = await creneauAPI.create({
                            jour_semaine: values.jour_semaine,
                            heure_debut: values.heure_debut,
                            heure_fin: values.heure_fin,
                            duree_minutes: duree,
                        });
                        creneau = creneauResponse.creneau || creneauResponse;
                    }
                } catch (creneauError) {
                    console.error('Erreur lors de la création/recherche du créneau:', creneauError);
                    setError('Erreur lors de la création du créneau. Veuillez réessayer.');
                    return;
                }
                
                // Créer la disponibilité
                await disponibiliteAPI.create({
                    id_user_enseignant: user.id_user,
                    id_creneau: creneau.id_creneau,
                    date_debut: values.date_debut,
                    date_fin: values.date_fin,
                    disponible: values.disponible,
                });
                setSuccess('Disponibilité ajoutée avec succès');
                formik.resetForm();
                setOpen(false);
                loadDisponibilites();
            } catch (error) {
                console.error('Erreur:', error);
                setError(error.message || 'Erreur lors de la création');
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) {
            try {
                await disponibiliteAPI.delete(id);
                setSuccess('Disponibilité supprimée avec succès');
                loadDisponibilites();
            } catch (error) {
                console.error('Erreur:', error);
                setError('Erreur lors de la suppression');
            }
        }
    };

    return (
        <DashboardLayout>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Mes Disponibilités
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setError('');
                            setSuccess('');
                            formik.resetForm();
                            setOpen(true);
                        }}
                    >
                        Ajouter une disponibilité
                    </Button>
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

                {loading ? (
                    <Typography>Chargement...</Typography>
                ) : disponibilites.length === 0 ? (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="body1" color="text.secondary" align="center">
                            Aucune disponibilité enregistrée
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Jour</TableCell>
                                    <TableCell>Heure début</TableCell>
                                    <TableCell>Heure fin</TableCell>
                                    <TableCell>Date début</TableCell>
                                    <TableCell>Date fin</TableCell>
                                    <TableCell>Disponible</TableCell>
                                    <TableCell align="right">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {disponibilites.map((disp) => (
                                    <TableRow key={disp.id_disponibilite}>
                                        <TableCell>{disp.creneau?.jour_semaine || '-'}</TableCell>
                                        <TableCell>{disp.creneau?.heure_debut || '-'}</TableCell>
                                        <TableCell>{disp.creneau?.heure_fin || '-'}</TableCell>
                                        <TableCell>{disp.date_debut ? new Date(disp.date_debut).toLocaleDateString('fr-FR') : '-'}</TableCell>
                                        <TableCell>{disp.date_fin ? new Date(disp.date_fin).toLocaleDateString('fr-FR') : '-'}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={disp.disponible ? 'Disponible' : 'Indisponible'}
                                                size="small"
                                                color={disp.disponible ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" color="error" onClick={() => handleDelete(disp.id_disponibilite)}>
                                                <Delete />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                    <form onSubmit={formik.handleSubmit}>
                        <DialogTitle>Nouvelle disponibilité</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Jour de la semaine"
                                    name="jour_semaine"
                                    value={formik.values.jour_semaine}
                                    onChange={formik.handleChange}
                                    error={formik.touched.jour_semaine && Boolean(formik.errors.jour_semaine)}
                                    helperText={formik.touched.jour_semaine && formik.errors.jour_semaine}
                                    SelectProps={{
                                        native: true,
                                    }}
                                >
                                    <option value="">Sélectionner un jour</option>
                                    {['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'].map((jour) => (
                                        <option key={jour} value={jour}>
                                            {jour.charAt(0).toUpperCase() + jour.slice(1)}
                                        </option>
                                    ))}
                                </TextField>
                                <TextField
                                    fullWidth
                                    label="Heure de début"
                                    name="heure_debut"
                                    type="time"
                                    value={formik.values.heure_debut}
                                    onChange={formik.handleChange}
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
                                    onChange={formik.handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    error={formik.touched.heure_fin && Boolean(formik.errors.heure_fin)}
                                    helperText={formik.touched.heure_fin && formik.errors.heure_fin}
                                />
                                <TextField
                                    fullWidth
                                    label="Date de début"
                                    name="date_debut"
                                    type="date"
                                    value={formik.values.date_debut}
                                    onChange={formik.handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    error={formik.touched.date_debut && Boolean(formik.errors.date_debut)}
                                    helperText={formik.touched.date_debut && formik.errors.date_debut}
                                />
                                <TextField
                                    fullWidth
                                    label="Date de fin"
                                    name="date_fin"
                                    type="date"
                                    value={formik.values.date_fin}
                                    onChange={formik.handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    error={formik.touched.date_fin && Boolean(formik.errors.date_fin)}
                                    helperText={formik.touched.date_fin && formik.errors.date_fin}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpen(false)}>Annuler</Button>
                            <Button type="submit" variant="contained">
                                Ajouter
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Box>
        </DashboardLayout>
    );
}

