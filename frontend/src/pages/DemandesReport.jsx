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
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Snackbar,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { demandeReportAPI, affectationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useFormik } from 'formik';
import * as yup from 'yup';

const validationSchema = yup.object({
    id_affectation: yup.number().required('L\'affectation est requise'),
    nouvelle_date: yup.date().required('La nouvelle date est requise'),
    motif: yup.string().required('Le motif est requis'),
});

export default function DemandesReport() {
    const { user } = useAuth();
    const [demandes, setDemandes] = useState([]);
    const [affectations, setAffectations] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user?.id_user) {
            loadDemandes();
            loadAffectations();
        }
    }, [user]);

    const loadAffectations = async () => {
        try {
            const data = await affectationAPI.getByEnseignant(user.id_user);
            setAffectations(data.data || []);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const loadDemandes = async () => {
        try {
            const data = await demandeReportAPI.getByEnseignant(user.id_user);
            setDemandes(data.data || data || []);
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors du chargement des demandes');
        } finally {
            setLoading(false);
        }
    };

    const formik = useFormik({
        initialValues: {
            id_affectation: '',
            nouvelle_date: '',
            motif: '',
        },
        validationSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError('');
                setSuccess('');
                // Ajouter automatiquement l'ID de l'enseignant connecté
                const dataToSend = {
                    ...values,
                    id_user_enseignant: user.id_user,
                    id_affectation: Number(values.id_affectation),
                    statut_demande: 'en_attente', // Valeur par défaut
                };
                await demandeReportAPI.create(dataToSend);
                setSuccess('Demande de report créée avec succès');
                formik.resetForm();
                setOpen(false);
                loadDemandes();
            } catch (error) {
                console.error('Erreur:', error);
                const errorMessage = error.message || error.response?.data?.message || error.response?.data?.error || 'Erreur lors de la création de la demande';
                setError(errorMessage);
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <DashboardLayout>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Demandes de Report
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
                        Nouvelle demande
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
                ) : demandes.length === 0 ? (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="body1" color="text.secondary" align="center">
                            Aucune demande de report
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Affectation</TableCell>
                                    <TableCell>Nouvelle date</TableCell>
                                    <TableCell>Motif</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Date de demande</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {demandes.map((demande) => (
                                    <TableRow key={demande.id_demande_report}>
                                        <TableCell>
                                            {demande.affectation?.cours?.nom_cours || '-'} -{' '}
                                            {demande.affectation?.groupe?.nom_groupe || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(demande.nouvelle_date).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                        <TableCell>{demande.motif}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={demande.statut}
                                                size="small"
                                                color={
                                                    demande.statut === 'approuvee'
                                                        ? 'success'
                                                        : demande.statut === 'refusee'
                                                          ? 'error'
                                                          : 'default'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(demande.date_demande).toLocaleDateString('fr-FR')}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                    <form onSubmit={formik.handleSubmit}>
                        <DialogTitle>Nouvelle demande de report</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Affectation"
                                    name="id_affectation"
                                    value={formik.values.id_affectation}
                                    onChange={formik.handleChange}
                                    error={formik.touched.id_affectation && Boolean(formik.errors.id_affectation)}
                                    helperText={formik.touched.id_affectation && formik.errors.id_affectation}
                                    SelectProps={{
                                        native: true,
                                    }}
                                >
                                    <option value="">Sélectionner une affectation</option>
                                    {affectations.map((aff) => (
                                        <option key={aff.id_affectation} value={aff.id_affectation}>
                                            {aff.cours?.nom_cours} - {aff.groupe?.nom_groupe} -{' '}
                                            {new Date(aff.date_seance).toLocaleDateString('fr-FR')}
                                        </option>
                                    ))}
                                </TextField>
                                <TextField
                                    fullWidth
                                    label="Nouvelle date"
                                    name="nouvelle_date"
                                    type="date"
                                    value={formik.values.nouvelle_date}
                                    onChange={formik.handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    error={formik.touched.nouvelle_date && Boolean(formik.errors.nouvelle_date)}
                                    helperText={formik.touched.nouvelle_date && formik.errors.nouvelle_date}
                                />
                                <TextField
                                    fullWidth
                                    label="Motif"
                                    name="motif"
                                    multiline
                                    rows={4}
                                    value={formik.values.motif}
                                    onChange={formik.handleChange}
                                    error={formik.touched.motif && Boolean(formik.errors.motif)}
                                    helperText={formik.touched.motif && formik.errors.motif}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpen(false)}>Annuler</Button>
                            <Button type="submit" variant="contained">
                                Créer
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Box>
        </DashboardLayout>
    );
}

