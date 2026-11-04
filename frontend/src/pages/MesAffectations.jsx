import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Alert, Snackbar, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';
import DemandeReportDialog from '../components/reports/DemandeReportDialog';
import ListeMesSeances from '../components/mesSeances/ListeMesSeances';
import { affectationAPI } from '../services/api';
import { fetchAll } from '../utils/fetchAll';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { aujourdhui as dateDeLEcole } from '../../../shared/dates.js';

/** Mes séances (enseignant) : la liste, l'appel du jour, et la demande de report d'une séance. */
export default function MesAffectations() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    // Appel par QR (I1) : seulement le jour de la séance, à la date de l'école (shared/dates.js)
    const aujourdhui = dateDeLEcole();
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
    // Une séance annulée, ou reportée à une date encore inconnue, n'a pas lieu ce jour-là
    const peutFaireAppel = (aff) => !['annule', 'a_reprogrammer'].includes(aff.statut) && String(aff.date_seance).slice(0, 10) === aujourdhui;
    const peutReporter = (aff) => ['planifie', 'confirme'].includes(aff.statut) && !estPassee(aff);

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
                    <ListeMesSeances
                        affectations={affectations}
                        peutFaireAppel={peutFaireAppel}
                        peutReporter={peutReporter}
                        onAppel={(aff) => navigate(`/appel/${aff.id_affectation}`)}
                        onReport={setAReporter}
                    />
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
