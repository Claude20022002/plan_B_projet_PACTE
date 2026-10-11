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
import { EventRepeat, QrCode2 } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { affectationAPI, demandeReportAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';

const STATUT_CONFIG = {
    // Une séance planifiée est tenue pour confirmée : rien à confirmer, sauf à demander un report
    planifie: { label: 'confirme', color: 'success'  },
    confirme: { label: 'confirme', color: 'success'  },
    annule:   { label: 'annule',   color: 'error'    },
    reporte:  { label: 'reporte',  color: 'warning'  },
    realise:  { label: 'realise',  color: 'default'  },
};

const reportSchema = yup.object({
    // Messages : des clés de traduction, traduites à l'affichage
    nouvelle_date: yup.date().required('mesSeances.erreurs.date'),
    motif: yup.string().min(10, 'mesSeances.erreurs.motifCourt').required('mesSeances.erreurs.motif'),
});

/** Mes séances (enseignant) : la liste, l'appel du jour, et la demande de report d'une séance. */
export default function MesAffectations() {
    const { t, i18n } = useTranslation();
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
            setError(t('mesSeances.erreurChargement'));
        } finally {
            setLoading(false);
        }
    };

    // Séance passée : plus de report possible (elle devient réalisée d'office)
    const estPassee = (aff) => {
        const fin = new Date(`${String(aff.date_seance).slice(0, 10)}T${aff.creneau?.heure_fin ?? '23:59'}`);
        return fin <= new Date();
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
                setSuccess(t('mesSeances.reportEnvoye'));
                closeReportDialog();
            } catch (err) {
                setError(err.response?.data?.message || err.message || t('mesSeances.erreurReport'));
            } finally {
                setSubmitting(false);
            }
        },
    });

    return (
        <DashboardLayout>
            <Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {t('mesSeances.titre')}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {t('mesSeances.sousTitre')}
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
                        <Typography color="text.secondary">{t('mesSeances.aucune')}</Typography>
                    </Paper>
                ) : (
                    <TableContainer component={Paper} sx={{ mt: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                                    <TableCell>{t('mesSeances.colonnes.cours')}</TableCell>
                                    <TableCell>{t('mesSeances.colonnes.groupe')}</TableCell>
                                    <TableCell>{t('mesSeances.colonnes.salle')}</TableCell>
                                    <TableCell>{t('mesSeances.colonnes.date')}</TableCell>
                                    <TableCell>{t('mesSeances.colonnes.creneau')}</TableCell>
                                    <TableCell>{t('mesSeances.colonnes.statut')}</TableCell>
                                    <TableCell align="center">{t('mesSeances.colonnes.actions')}</TableCell>
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
                                                {new Date(aff.date_seance).toLocaleDateString(i18n.language)}
                                            </TableCell>
                                            <TableCell>
                                                {aff.creneau?.heure_debut} – {aff.creneau?.heure_fin}
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={t(`mesSeances.statuts.${label}`, { defaultValue: label })} size="small" color={color} />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                    {aff.statut !== 'annule' && String(aff.date_seance).slice(0, 10) === aujourdhui && (
                                                        <Tooltip title={t('mesSeances.appel')}>
                                                            <IconButton size="small" color="primary" onClick={() => navigate(`/appel/${aff.id_affectation}`)} aria-label={t('mesSeances.appel')}>
                                                                <QrCode2 fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    )}
                                                    {['planifie', 'confirme'].includes(aff.statut) && !estPassee(aff) && (
                                                        <Tooltip title={t('mesSeances.demanderReport')}>
                                                            <IconButton
                                                                size="small"
                                                                color="warning"
                                                                onClick={() => openReportDialog(aff)}
                                                                aria-label={t('mesSeances.demanderReport')}
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
                        <DialogTitle>{t('mesSeances.titreReport')}</DialogTitle>
                        <DialogContent>
                            <Box sx={{ mt: 1 }}>
                                <Paper variant="outlined" sx={{ p: 1.5, mb: 2, bgcolor: 'grey.50' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>{t('mesSeances.colonnes.cours')} :</strong> {reportDialog.affectation?.cours?.nom_cours}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>{t('mesSeances.colonnes.groupe')} :</strong> {reportDialog.affectation?.groupe?.nom_groupe}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>{t('mesSeances.dateActuelle')} :</strong>{' '}
                                        {reportDialog.affectation &&
                                            new Date(reportDialog.affectation.date_seance).toLocaleDateString(i18n.language, {
                                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                                            })}
                                    </Typography>
                                </Paper>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        fullWidth
                                        label={t('mesSeances.nouvelleDate')}
                                        name="nouvelle_date"
                                        type="date"
                                        value={reportFormik.values.nouvelle_date}
                                        onChange={reportFormik.handleChange}
                                        onBlur={reportFormik.handleBlur}
                                        InputLabelProps={{ shrink: true }}
                                        error={reportFormik.touched.nouvelle_date && Boolean(reportFormik.errors.nouvelle_date)}
                                        helperText={reportFormik.touched.nouvelle_date && reportFormik.errors.nouvelle_date && t(reportFormik.errors.nouvelle_date)}
                                    />
                                    <TextField
                                        fullWidth
                                        label={t('mesSeances.motif')}
                                        name="motif"
                                        multiline
                                        rows={4}
                                        value={reportFormik.values.motif}
                                        onChange={reportFormik.handleChange}
                                        onBlur={reportFormik.handleBlur}
                                        error={reportFormik.touched.motif && Boolean(reportFormik.errors.motif)}
                                        helperText={reportFormik.touched.motif && reportFormik.errors.motif && t(reportFormik.errors.motif)}
                                        placeholder={t('mesSeances.motifAide')}
                                    />
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={closeReportDialog}>{t('common.cancel')}</Button>
                            <Button
                                type="submit"
                                variant="contained"
                                color="warning"
                                disabled={reportFormik.isSubmitting}
                                startIcon={reportFormik.isSubmitting ? <CircularProgress size={16} color="inherit" /> : <EventRepeat />}
                            >
                                {reportFormik.isSubmitting ? t('mesSeances.envoi') : t('mesSeances.envoyer')}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Box>
        </DashboardLayout>
    );
}
