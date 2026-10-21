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
    Alert,
    Snackbar,
    CircularProgress,
} from '@mui/material';
import { EventRepeat, QrCode2 } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';
import DemandeReportDialog from '../components/reports/DemandeReportDialog';
import { dateCourte, heureCourte } from '../components/reports/format';
import { affectationAPI } from '../services/api';
import { fetchAll } from '../utils/fetchAll';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const STATUT_CONFIG = {
    // Une séance planifiée est tenue pour confirmée : rien à confirmer, sauf à demander un report
    planifie: { label: 'confirme', color: 'success'  },
    confirme: { label: 'confirme', color: 'success'  },
    annule:   { label: 'annule',   color: 'error'    },
    reporte:  { label: 'reporte',  color: 'warning'  },
    realise:  { label: 'realise',  color: 'default'  },
};

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
    const [aReporter, setAReporter]           = useState(null);

    useEffect(() => {
        if (user?.id_user) loadAffectations();
    }, [user]);

    const loadAffectations = async () => {
        try {
            // Toutes les pages : le serveur en rend au plus 100 séances à la fois
            setAffectations(await fetchAll((p) => affectationAPI.getByEnseignant(user.id_user, p)));
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
                                                {dateCourte(aff.date_seance, i18n.language)}
                                            </TableCell>
                                            <TableCell>
                                                {heureCourte(aff.creneau?.heure_debut)}–{heureCourte(aff.creneau?.heure_fin)}
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
                                                                onClick={() => setAReporter(aff)}
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

                {/* Demande de report : le formulaire commun, sur la séance choisie */}
                <DemandeReportDialog
                    open={Boolean(aReporter)}
                    seanceFixe={aReporter}
                    onClose={() => setAReporter(null)}
                    onEnvoyee={() => {
                        setSuccess(t('mesSeances.reportEnvoye'));
                        setAReporter(null);
                    }}
                />
            </Box>
        </DashboardLayout>
    );
}
