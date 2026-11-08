import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Autocomplete, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { Print } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import DocumentEdtMois, { StyleImpressionEdt } from '../components/edt/DocumentEdtMois';
import PublicationMois from '../components/edt/PublicationMois';
import EmptyState from '../design-system/components/EmptyState';
import { TableSkeleton } from '../design-system/components/PremiumSkeleton';
import { appartenanceAPI, groupeAPI, preparationAPI } from '../services/api';
import { estResponsable } from '../utils/droits';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchAll } from '../utils/fetchAll';
import useAnnees from '../hooks/useAnnees';
import { groupesDuJour } from '../utils/annees';
import OngletsEmploisDuTemps from '../components/gestion/OngletsEmploisDuTemps';

const moisCourant = () => new Date().toISOString().slice(0, 7);

/**
 * Emploi du temps du mois au format officiel HESTIM (phase P4) : copie de l'EDT d'octobre 2026
 * (docs/Planning). Le serveur calcule fusions, (P.S)/(D.S) et blocs ; la page ne fait que
 * dessiner (DocumentEdtMois), et s'imprime (ou s'enregistre en PDF) depuis le navigateur.
 * L'administration et le responsable y publient le mois (PublicationMois) : les étudiants
 * voient la version publiée.
 */
export default function EdtMensuel() {
    const { t } = useTranslation();
    const toast = useToast();
    const { user } = useAuth();
    const [params, setParams] = useSearchParams();
    const [groupes, setGroupes] = useState([]);
    const [idGroupe, setIdGroupe] = useState(params.get('groupe') ? Number(params.get('groupe')) : null);
    const [mois, setMois] = useState(params.get('mois') || moisCourant());
    const [edt, setEdt] = useState(null);
    const [loading, setLoading] = useState(false);
    const etudiant = user?.role === 'etudiant';
    // Publier et envoyer le mois (R4) : administration ou responsable de filière
    const peutPublier = user?.role === 'admin' || estResponsable(user);
    const groupe = groupes.find((g) => g.id_groupe === idGroupe) ?? null;
    // Les classes de l'année du mois affiché (lot ME-18), plus celle déjà choisie
    const annees = useAnnees(!etudiant);
    const classesDuMois = groupesDuJour(groupes, annees ?? [], `${mois}-01`, [idGroupe]);

    useEffect(() => {
        if (etudiant) {
            appartenanceAPI
                .getByEtudiant(user.id_user)
                .then((a) => setIdGroupe((g) => g ?? a.id_groupe))
                .catch(() => toast.error(t('monthly.noGroup')));
        } else {
            fetchAll(groupeAPI.getAll).then(setGroupes).catch(() => {});
        }
    }, [etudiant, user?.id_user, t, toast]);

    useEffect(() => {
        if (!idGroupe || !mois) return;
        setParams({ groupe: String(idGroupe), mois }, { replace: true });
        setLoading(true);
        preparationAPI
            .edtMensuel(idGroupe, mois)
            .then(setEdt)
            .catch((error) => toast.error(error.response?.data?.error || error.message))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [idGroupe, mois]);

    return (
        <DashboardLayout>
            {user?.role === 'admin' && <OngletsEmploisDuTemps />}
            <StyleImpressionEdt />
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider', mb: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                    {!etudiant && (
                        <Autocomplete
                            sx={{ minWidth: 260 }}
                            size="small"
                            options={classesDuMois}
                            value={groupe}
                            onChange={(_, v) => setIdGroupe(v?.id_groupe ?? null)}
                            getOptionLabel={(g) => g.nom_groupe}
                            isOptionEqualToValue={(a, b) => a.id_groupe === b.id_groupe}
                            renderInput={(p) => <TextField {...p} label={t('monthly.group')} />}
                        />
                    )}
                    <TextField type="month" size="small" label={t('tracking.month')} value={mois} onChange={(e) => setMois(e.target.value)} InputLabelProps={{ shrink: true }} />
                    <Box sx={{ flex: 1 }} />
                    <Button variant="contained" startIcon={<Print />} onClick={() => window.print()} disabled={!edt}>
                        {t('monthly.print')}
                    </Button>
                </Stack>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {t('monthly.help')}
                </Typography>
                {peutPublier && groupe && <PublicationMois mois={mois} groupe={groupe} onChoisirClasse={setIdGroupe} />}
            </Paper>

            {loading ? (
                <TableSkeleton rows={8} />
            ) : !edt ? (
                <EmptyState title={t('monthly.emptyTitle')} description={t('monthly.emptyBody')} />
            ) : (
                <Box className="edt-impression">
                    <DocumentEdtMois edt={edt} />
                </Box>
            )}
        </DashboardLayout>
    );
}
