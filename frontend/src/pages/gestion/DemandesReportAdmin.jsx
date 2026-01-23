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
    Alert,
    Snackbar,
    IconButton,
    Tooltip,
    CircularProgress,
} from '@mui/material';
import { Check, Close, Visibility } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { demandeReportAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function DemandesReportAdmin() {
    const { user } = useAuth();
    const [demandes, setDemandes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [detailDialog, setDetailDialog] = useState({ open: false, demande: null });
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        loadDemandes();
    }, []);

    const loadDemandes = async () => {
        try {
            setLoading(true);
            const data = await demandeReportAPI.getAll();
            setDemandes(data.data || data || []);
        } catch (error) {
            console.error('Erreur:', error);
            setError('Erreur lors du chargement des demandes');
        } finally {
            setLoading(false);
        }
    };

    const traiterDemande = async (id, action) => {
        try {
            setProcessingId(id);
            setError('');
            setSuccess('');
            
            await demandeReportAPI.traiter(id, action);
            
            setSuccess(`Demande ${action === 'approuver' ? 'approuvée' : 'refusée'} avec succès`);
            await loadDemandes();
        } catch (error) {
            console.error('Erreur:', error);
            const errorMessage = error.message || error.response?.data?.message || error.response?.data?.error || `Erreur lors du traitement de la demande`;
            setError(errorMessage);
        } finally {
            setProcessingId(null);
        }
    };

    const getStatutColor = (statut) => {
        switch (statut) {
            case 'approuve':
                return 'success';
            case 'refuse':
                return 'error';
            case 'en_attente':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getStatutLabel = (statut) => {
        switch (statut) {
            case 'approuve':
                return 'Approuvée';
            case 'refuse':
                return 'Refusée';
            case 'en_attente':
                return 'En attente';
            default:
                return statut;
        }
    };

    return (
        <DashboardLayout>
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Gestion des Demandes de Report
                    </Typography>
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
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                    </Box>
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
                                    <TableCell>Enseignant</TableCell>
                                    <TableCell>Affectation</TableCell>
                                    <TableCell>Date actuelle</TableCell>
                                    <TableCell>Nouvelle date</TableCell>
                                    <TableCell>Motif</TableCell>
                                    <TableCell>Statut</TableCell>
                                    <TableCell>Date de demande</TableCell>
                                    <TableCell align="center">Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {demandes.map((demande) => {
                                    const demandeId = demande.id_demande || demande.id_demande_report;
                                    return (
                                        <TableRow key={demandeId}>
                                            <TableCell>
                                                {demande.enseignant?.prenom || ''} {demande.enseignant?.nom || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {demande.affectation?.cours?.nom_cours || '-'} -{' '}
                                                {demande.affectation?.groupe?.nom_groupe || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {demande.affectation?.date_seance
                                                    ? new Date(demande.affectation.date_seance).toLocaleDateString('fr-FR')
                                                    : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(demande.nouvelle_date).toLocaleDateString('fr-FR')}
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title={demande.motif}>
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            maxWidth: 200,
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {demande.motif}
                                                    </Typography>
                                                </Tooltip>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={getStatutLabel(demande.statut_demande)}
                                                    size="small"
                                                    color={getStatutColor(demande.statut_demande)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {new Date(demande.date_demande).toLocaleDateString('fr-FR')}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                    <Tooltip title="Voir les détails">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setDetailDialog({ open: true, demande })}
                                                        >
                                                            <Visibility />
                                                        </IconButton>
                                                    </Tooltip>
                                                    {demande.statut_demande === 'en_attente' && (
                                                        <>
                                                            <Tooltip title="Approuver">
                                                                <IconButton
                                                                    size="small"
                                                                    color="success"
                                                                    onClick={() => traiterDemande(demandeId, 'approuver')}
                                                                    disabled={processingId === demandeId}
                                                                >
                                                                    {processingId === demandeId ? (
                                                                        <CircularProgress size={20} />
                                                                    ) : (
                                                                        <Check />
                                                                    )}
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Refuser">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => traiterDemande(demandeId, 'refuser')}
                                                                    disabled={processingId === demandeId}
                                                                >
                                                                    {processingId === demandeId ? (
                                                                        <CircularProgress size={20} />
                                                                    ) : (
                                                                        <Close />
                                                                    )}
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
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

                {/* Dialog de détails */}
                <Dialog
                    open={detailDialog.open}
                    onClose={() => setDetailDialog({ open: false, demande: null })}
                    maxWidth="md"
                    fullWidth
                >
                    {detailDialog.demande && (
                        <>
                            <DialogTitle>Détails de la demande de report</DialogTitle>
                            <DialogContent>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Enseignant
                                        </Typography>
                                        <Typography variant="body1">
                                            {detailDialog.demande.enseignant?.prenom || ''}{' '}
                                            {detailDialog.demande.enseignant?.nom || '-'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Affectation
                                        </Typography>
                                        <Typography variant="body1">
                                            {detailDialog.demande.affectation?.cours?.nom_cours || '-'} -{' '}
                                            {detailDialog.demande.affectation?.groupe?.nom_groupe || '-'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Date actuelle de la séance
                                        </Typography>
                                        <Typography variant="body1">
                                            {detailDialog.demande.affectation?.date_seance
                                                ? new Date(detailDialog.demande.affectation.date_seance).toLocaleDateString('fr-FR', {
                                                      weekday: 'long',
                                                      year: 'numeric',
                                                      month: 'long',
                                                      day: 'numeric',
                                                  })
                                                : '-'}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Nouvelle date proposée
                                        </Typography>
                                        <Typography variant="body1">
                                            {new Date(detailDialog.demande.nouvelle_date).toLocaleDateString('fr-FR', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Motif
                                        </Typography>
                                        <Typography variant="body1">{detailDialog.demande.motif}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Statut
                                        </Typography>
                                        <Chip
                                            label={getStatutLabel(detailDialog.demande.statut_demande)}
                                            size="small"
                                            color={getStatutColor(detailDialog.demande.statut_demande)}
                                            sx={{ mt: 0.5 }}
                                        />
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            Date de demande
                                        </Typography>
                                        <Typography variant="body1">
                                            {new Date(detailDialog.demande.date_demande).toLocaleDateString('fr-FR', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </Typography>
                                    </Box>
                                </Box>
                            </DialogContent>
                            <DialogActions>
                                {detailDialog.demande.statut_demande === 'en_attente' && (
                                    <>
                                        <Button
                                            color="error"
                                            onClick={() => {
                                                const demandeId = detailDialog.demande.id_demande || detailDialog.demande.id_demande_report;
                                                setDetailDialog({ open: false, demande: null });
                                                traiterDemande(demandeId, 'refuser');
                                            }}
                                        >
                                            Refuser
                                        </Button>
                                        <Button
                                            color="success"
                                            variant="contained"
                                            onClick={() => {
                                                const demandeId = detailDialog.demande.id_demande || detailDialog.demande.id_demande_report;
                                                setDetailDialog({ open: false, demande: null });
                                                traiterDemande(demandeId, 'approuver');
                                            }}
                                        >
                                            Approuver
                                        </Button>
                                    </>
                                )}
                                <Button onClick={() => setDetailDialog({ open: false, demande: null })}>
                                    Fermer
                                </Button>
                            </DialogActions>
                        </>
                    )}
                </Dialog>
            </Box>
        </DashboardLayout>
    );
}
