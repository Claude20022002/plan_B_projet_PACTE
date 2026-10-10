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
    Chip,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Alert,
    Snackbar,
    CircularProgress,
} from '@mui/material';
import { EventRepeat, QrCode2, TaskAlt } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { affectationAPI, demandeReportAPI, suiviAPI } from '../services/api';
import MesRetours from '../components/planning/MesRetours';
import { useAuth } from '../contexts/AuthContext';
import { useFormik } from 'formik';
import * as yup from 'yup';

const STATUT_CONFIG = {
    // Une séance planifiée est tenue pour confirmée : rien à confirmer, sauf à demander un report
    planifie: { label: 'Confirmé',  color: 'success'  },
    confirme: { label: 'Confirmé',  color: 'success'  },
    annule:   { label: 'Annulé',    color: 'error'    },
    reporte:  { label: 'Reporté',   color: 'warning'  },
    realise:  { label: 'Réalisé',   color: 'default'  },
};

const reportSchema = yup.object({
    nouvelle_date: yup.date().required('La nouvelle date est requise'),
    motif: yup.string().min(10, 'Minimum 10 caractères').required('Le motif est requis'),
});

export default function MesAffectations() {
    const navigate = useNavigate();
    // Appel par QR (I1) : seulement le jour de la séance (date locale du navigateur)
    const aujourdhui = new Date().toLocaleDateString('en-CA');
    const { user } = useAuth();
    const [affectations, setAffectations]     = useState([]);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState('');
    const [success, setSuccess]               = useState('');
    const [reportDialog, setReportDialog]     = useState({ open: false, affectation: null });

    useEffect(() => {
        if (user?.id_user) loadAffectations();
    }, [user]);

    const loadAffectations = async () => {
        try {
            const data = await affectationAPI.getByEnseignant(user.id_user, { limit: 1000 });
            setAffectations(data.data || []);
        } catch {
            setError('Erreur lors du chargement des affectations');
        } finally {
            setLoading(false);
        }
    };

    // Séance faite (phase P7) : possible une fois l'heure de fin passée
    const estPassee = (aff) => {
        const fin = new Date(`${String(aff.date_seance).slice(0, 10)}T${aff.creneau?.heure_fin ?? '23:59'}`);
        return fin <= new Date();
    };
    const handleRealiser = async (aff) => {
        try {
            await suiviAPI.realiser(aff.id_affectation);
            setSuccess(`Séance « ${aff.cours?.nom_cours} » marquée réalisée`);
            loadAffectations();
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        }
    };

    const openReportDialog = (aff) => {
        reportFormik.resetForm();
        setReportDialog({ open: true, affectation: aff });
    };
    const closeReportDialog = () => setReportDialog({ open: false, affectation: null });

    const reportFormik = useFormik({
        initialValues: { nouvelle_date: '', motif: '' },
        validationSchema: reportSchema,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError('');
                await demandeReportAPI.create({
                    id_user_enseignant: user.id_user,
                    id_affectation:     reportDialog.affectation.id_affectation,
                    nouvelle_date:      values.nouvelle_date,
                    motif:              values.motif,
                    statut_demande:     'en_attente',
                });
                setSuccess('Demande de report envoyée, en attente de validation par l\'administration.');
                closeReportDialog();
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Erreur lors de la demande de report');
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <DashboardLayout>
            <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Mes Affectations
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Confirmez vos séances planifiées ou demandez un report si nécessaire.
                </Typography>

                <Snackbar open={!!error}   autoHideDuration={6000} onClose={() => setError('')}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                    <Alert severity="error"   onClose={() => setError('')}   sx={{ width: '100%' }}>{error}</Alert>
                </Snackbar>
                <Snackbar open={!!success} autoHideDuration={4000} onClose={() => setSuccess('')}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                    <Alert severity="success" onClose={() => setSuccess('')} sx={{ width: '100%' }}>{success}</Alert>
                </Snackbar>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : affectations.length === 0 ? (
                    <Paper sx={{ p: 4, mt: 2, textAlign: 'center' }}>
                        <Typography color="text.secondary">Aucune affectation trouvée</Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                                    <TableCell>Cours</TableCell>
                                    <TableCell>Groupe</TableCell>
                                    <TableCell>Salle</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Créneau</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {affectations.map((aff) => {
                                    const { label, color } = STATUT_CONFIG[aff.statut] ?? { label: aff.statut, color: 'default' };
                                    return (
                                        <TableRow key={aff.id_affectation} hover>
                                            <TableCell>{aff.cours?.nom_cours || '-'}</TableCell>
                                            <TableCell>{aff.groupe?.nom_groupe || '-'}</TableCell>
                                            <TableCell>{aff.salle?.nom_salle || '-'}</TableCell>
                                            <TableCell>
                                                {new Date(aff.date_seance).toLocaleDateString('fr-FR')}
                                            </TableCell>
                                            <TableCell>
                                                {aff.creneau?.heure_debut} – {aff.creneau?.heure_fin}
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={label} size="small" color={color} />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                    {aff.statut !== 'annule' && String(aff.date_seance).slice(0, 10) === aujourdhui && (
                                                        <Tooltip title="Faire l'appel (QR code)">
                                                            <IconButton size="small" color="primary" onClick={() => navigate(`/appel/${aff.id_affectation}`)}>
                                                                <QrCode2 fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {['planifie', 'confirme', 'reporte'].includes(aff.statut) && estPassee(aff) && (
                                                        <Tooltip title="Marquer la séance réalisée">
                                                            <IconButton size="small" onClick={() => handleRealiser(aff)}>
                                                                <TaskAlt fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {['planifie', 'confirme'].includes(aff.statut) && !estPassee(aff) && (
                                                        <Tooltip title="Demander un report">
                                                            <IconButton
                                                                size="small"
                                                                color="warning"
                                                                onClick={() => openReportDialog(aff)}
                                                            >
                                                                <EventRepeat fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* ── Dialog demande de report ───────────────────────────────── */}
                <Dialog open={reportDialog.open} onClose={closeReportDialog} maxWidth="sm" fullWidth>
                    <form onSubmit={reportFormik.handleSubmit}>
                        <DialogTitle>Demander un report de séance</DialogTitle>
                        <DialogContent>
                            <Box sx={{ mt: 1 }}>
                                <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'grey.50' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Cours :</strong> {reportDialog.affectation?.cours?.nom_cours}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Groupe :</strong> {reportDialog.affectation?.groupe?.nom_groupe}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Date actuelle :</strong>{' '}
                                        {reportDialog.affectation &&
                                            new Date(reportDialog.affectation.date_seance).toLocaleDateString('fr-FR', {
                                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                            })}
                                    </Typography>
                                </Paper>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        fullWidth
                                        label="Nouvelle date souhaitée"
                                        name="nouvelle_date"
                                        type="date"
                                        value={reportFormik.values.nouvelle_date}
                                        onChange={reportFormik.handleChange}
                                        onBlur={reportFormik.handleBlur}
                                        InputLabelProps={{ shrink: true }}
                                        error={reportFormik.touched.nouvelle_date && Boolean(reportFormik.errors.nouvelle_date)}
                                        helperText={reportFormik.touched.nouvelle_date && reportFormik.errors.nouvelle_date}
                                    />
                                    <TextField
                                        fullWidth
                                        label="Motif du report"
                                        name="motif"
                                        multiline
                                        rows={4}
                                        value={reportFormik.values.motif}
                                        onChange={reportFormik.handleChange}
                                        onBlur={reportFormik.handleBlur}
                                        error={reportFormik.touched.motif && Boolean(reportFormik.errors.motif)}
                                        helperText={reportFormik.touched.motif && reportFormik.errors.motif}
                                        placeholder="Expliquez pourquoi vous demandez un report (min. 10 caractères)…"
                                    />
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={closeReportDialog}>Annuler</Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="warning"
                                disabled={reportFormik.isSubmitting}
                                startIcon={reportFormik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : <EventRepeat />}
                            >
                                {reportFormik.isSubmitting ? 'Envoi…' : 'Envoyer la demande'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
                <MesRetours />
            </Box>
        </DashboardLayout>
    );
}
