import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Button, Paper, Typography } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import DashboardLayout from '../components/layouts/DashboardLayout';
import OngletsMonService from '../components/monService/OngletsMonService';
import DemandeReportDialog from '../components/reports/DemandeReportDialog';
import ListeDemandesEnseignant from '../components/reports/ListeDemandesEnseignant';
import ProposerCreneauDialog from '../components/reports/ProposerCreneauDialog';
import useConfirmerReport from '../components/reports/useConfirmerReport';
import { demandeReportAPI, affectationAPI } from '../services/api';
import { fetchAll } from '../utils/fetchAll';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import useCreneauxParId from '../hooks/useCreneauxParId';

// Une séance se reporte tant qu'elle n'a pas commencé, n'est pas annulée ni déjà en attente d'une nouvelle date
const reportable = (s) => !['annule', 'a_reprogrammer'].includes(s.statut) && new Date(`${String(s.date_seance).slice(0, 10)}T${s.creneau?.heure_debut ?? '00:00'}`) > new Date();

/**
 * Mes demandes de report (enseignant) : la liste et le formulaire d'une nouvelle demande.
 * `?seance=<id>` (bouton « Demander un report » du tableau) ouvre le formulaire sur cette séance.
 * Un report validé par l'administration attend ici la réponse de l'enseignant : accepter, ou
 * proposer un autre créneau. `?demande=<id>` (notification « Report à confirmer ») met cette
 * demande en évidence et y fait défiler la page.
 */
export default function DemandesReport() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const toast = useToast();
    const creneaux = useCreneauxParId();
    const [params, setParams] = useSearchParams();
    const [demandes, setDemandes] = useState([]);
    const [seances, setSeances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formulaire, setFormulaire] = useState({ open: false, idSeance: '' });
    const [enEvidence, setEnEvidence] = useState(null);

    const chargerDemandes = useCallback(async () => {
        try {
            const data = await demandeReportAPI.getByEnseignant(user.id_user);
            setDemandes(data.data || data || []);
        } catch {
            toast.error(t('reports.erreurChargement'));
        } finally {
            setLoading(false);
        }
    }, [user?.id_user, t, toast]);
    const confirmation = useConfirmerReport(chargerDemandes);

    useEffect(() => {
        if (!user?.id_user) return;
        chargerDemandes();
        // Toutes les pages : le serveur rend au plus 100 séances à la fois
        fetchAll((p) => affectationAPI.getByEnseignant(user.id_user, p))
            .then((liste) => setSeances(liste.filter(reportable).sort((a, b) => String(a.date_seance).localeCompare(String(b.date_seance)))))
            .catch(() => toast.error(t('reports.erreurChargement')));
    }, [user?.id_user, chargerDemandes, t, toast]);

    // Arrivée depuis une séance précise : le formulaire s'ouvre dessus, une seule fois.
    // Arrivée depuis la notification d'un report à confirmer : cette demande est mise en évidence.
    useEffect(() => {
        const idSeance = params.get('seance');
        const idDemande = params.get('demande');
        if (!idSeance && !idDemande) return;
        if (idSeance) setFormulaire({ open: true, idSeance });
        if (idDemande) setEnEvidence(Number(idDemande));
        setParams({}, { replace: true });
    }, [params, setParams]);

    // La demande mise en évidence peut être loin dans la liste : la page défile jusqu'à elle
    useEffect(() => {
        if (enEvidence && !loading) document.getElementById(`demande-${enEvidence}`)?.scrollIntoView({ block: 'center' });
    }, [enEvidence, loading]);

    const fermer = () => setFormulaire({ open: false, idSeance: '' });

    return (
        <DashboardLayout>
            <OngletsMonService />
            <Box>
                {/* Le titre est l'onglet de « Mon service » : seule l'action reste ici */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button variant="contained" startIcon={<Add />} onClick={() => setFormulaire({ open: true, idSeance: '' })}>
                        {t('reports.nouvelle')}
                    </Button>
                </Box>

                {loading ? (
                    <Typography>{t('common.loading')}</Typography>
                ) : demandes.length === 0 ? (
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="body1" color="text.secondary" align="center">
                            {t('reports.aucune')}
                        </Typography>
                    </Paper>
                ) : (
                    <ListeDemandesEnseignant
                        demandes={demandes}
                        creneaux={creneaux}
                        enCours={confirmation.enCours}
                        enEvidence={enEvidence}
                        onAccepter={confirmation.accepter}
                        onProposer={confirmation.proposer}
                    />
                )}

                <ProposerCreneauDialog
                    demande={confirmation.aProposer}
                    avertissement={confirmation.avertissement}
                    onClose={confirmation.fermerProposition}
                    onProposee={confirmation.proposee}
                />

                <DemandeReportDialog
                    open={formulaire.open}
                    seances={seances}
                    idSeanceInitiale={formulaire.idSeance}
                    onClose={fermer}
                    onEnvoyee={() => {
                        toast.success(t('reports.creee'));
                        fermer();
                        chargerDemandes();
                    }}
                />
            </Box>
        </DashboardLayout>
    );
}
