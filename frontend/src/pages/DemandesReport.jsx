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
import OngletsMonService from '../components/monService/OngletsMonService';
import { demandeReportAPI, affectationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';

const validationSchema = yup.object({
    // Messages : des clés de traduction, traduites à l'affichage
    id_affectation: yup.number().required('reports.erreurs.affectation'),
    nouvelle_date: yup.date().required('reports.erreurs.date'),
    motif: yup.string().required('reports.erreurs.motif'),
});

/** Mes demandes de report (enseignant) : la liste et le formulaire d'une nouvelle demande. */
export default function DemandesReport() {
    const { t, i18n } = useTranslation();
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
            setError(t('reports.erreurChargement'));
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
                setSuccess(t('reports.creee'));
                formik.resetForm();
                setOpen(false);
                loadDemandes();
            } catch (error) {
                console.error('Erreur:', error);
                const errorMessage = error.message || error.response?.data?.message || error.response?.data?.error || t('reports.erreurCreation');
                setError(errorMessage);
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <DashboardLayout>
            <OngletsMonService />
            <Box>
                {/* Le titre est l'onglet de « Mon service » : seule l'action reste ici */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
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
                        {t('reports.nouvelle')}
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
                    <Typography>{t('common.loading')}</Typography>
                ) : demandes.length === 0 ? (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="body1" color="text.secondary" align="center">
                            {t('reports.aucune')}
                        </Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('reports.colonnes.seance')}</TableCell>
                                    <TableCell>{t('reports.colonnes.nouvelleDate')}</TableCell>
                                    <TableCell>{t('reports.colonnes.motif')}</TableCell>
                                    <TableCell>{t('reports.colonnes.statut')}</TableCell>
                                    <TableCell>{t('reports.colonnes.dateDemande')}</TableCell>
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
                                            {new Date(demande.nouvelle_date).toLocaleDateString(i18n.language)}
                                        </TableCell>
                                        <TableCell>{demande.motif}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={
                                                    t(`reports.statuts.${demande.statut_demande === 'approuve' || demande.statut_demande === 'refuse' ? demande.statut_demande : 'en_attente'}`)
                                                }
                                                size="small"
                                                color={
                                                    demande.statut_demande === 'approuve' ? 'success' :
                                                    demande.statut_demande === 'refuse'   ? 'error'   :
                                                    'warning'
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(demande.date_demande).toLocaleDateString(i18n.language)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                    <form onSubmit={formik.handleSubmit}>
                        <DialogTitle>{t('reports.titreFormulaire')}</DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label={t('reports.champs.seance')}
                                    name="id_affectation"
                                    value={formik.values.id_affectation}
                                    onChange={formik.handleChange}
                                    error={formik.touched.id_affectation && Boolean(formik.errors.id_affectation)}
                                    helperText={formik.touched.id_affectation && formik.errors.id_affectation && t(formik.errors.id_affectation)}
                                    SelectProps={{
                                        native: true,
                                    }}
                                >
                                    <option value="">{t('reports.champs.choisir')}</option>
                                    {affectations.map((aff) => (
                                        <option key={aff.id_affectation} value={aff.id_affectation}>
                                            {aff.cours?.nom_cours} - {aff.groupe?.nom_groupe} -{' '}
                                            {new Date(aff.date_seance).toLocaleDateString(i18n.language)}
                                        </option>
                                    ))}
                                </TextField>
                                <TextField
                                    fullWidth
                                    label={t('reports.champs.nouvelleDate')}
                                    name="nouvelle_date"
                                    type="date"
                                    value={formik.values.nouvelle_date}
                                    onChange={formik.handleChange}
                                    InputLabelProps={{ shrink: true }}
                                    error={formik.touched.nouvelle_date && Boolean(formik.errors.nouvelle_date)}
                                    helperText={formik.touched.nouvelle_date && formik.errors.nouvelle_date && t(formik.errors.nouvelle_date)}
                                />
                                <TextField
                                    fullWidth
                                    label={t('reports.champs.motif')}
                                    name="motif"
                                    multiline
                                    rows={4}
                                    value={formik.values.motif}
                                    onChange={formik.handleChange}
                                    error={formik.touched.motif && Boolean(formik.errors.motif)}
                                    helperText={formik.touched.motif && formik.errors.motif && t(formik.errors.motif)}
                                />
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                            <Button type="submit" variant="contained">
                                {t('reports.creer')}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Box>
        </DashboardLayout>
    );
}

