import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Paper, Stack, Typography } from '@mui/material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import EmptyState from '../design-system/components/EmptyState';
import { TableSkeleton } from '../design-system/components/PremiumSkeleton';
import { examenAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { ds } from '../design-system/tokens';

const hhmm = (h) => String(h || '').slice(0, 5);

/**
 * Épreuves publiées qui me concernent : mes surveillances (enseignant, avec la salle où je
 * surveille) ou mes examens (étudiant, épreuves de mon groupe et des groupes qui le contiennent).
 */
export default function MesExamens() {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const { user } = useAuth();
    const enseignant = user?.role === 'enseignant';
    const [examens, setExamens] = useState([]);
    const [loading, setLoading] = useState(true);

    const formatDate = useMemo(() => new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }), [i18n.language]);

    useEffect(() => {
        (enseignant ? examenAPI.getMesSurveillances() : examenAPI.getMesExamens())
            .then(setExamens)
            .catch(() => toast.error(t('common.errorLoad')))
            .finally(() => setLoading(false));
    }, [enseignant, t, toast]);

    const aVenir = examens.filter((e) => e.date >= new Date().toISOString().slice(0, 10));

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
                    {enseignant ? t('exams.mineTeacher') : t('exams.mineStudent')}
                </Typography>
                {loading ? (
                    <TableSkeleton rows={4} />
                ) : aVenir.length === 0 ? (
                    <EmptyState title={t('exams.noneTitle')} description={enseignant ? t('exams.noneTeacher') : t('exams.noneStudent')} />
                ) : (
                    <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                        {aVenir.map((e) => {
                            const mesSalles = enseignant ? e.surveillances.filter((s) => s.id_user === user.id_user).map((s) => s.salle?.nom_salle ?? e.salles.find((x) => x.id_salle === s.id_salle)?.salle?.nom_salle) : e.salles.map((s) => s.salle?.nom_salle);
                            return (
                                <Stack key={e.id_session} direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ minWidth: 220 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>
                                            {formatDate.format(new Date(`${e.date}T12:00:00`))}
                                        </Typography>
                                        <Typography sx={{ fontFamily: ds.font.board, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                            {hhmm(e.heure_debut)}–{hhmm(e.heure_fin)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {e.titre}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {e.cours?.code_cours} · {e.groupes.map((g) => g.nom_groupe).join(', ')}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontFamily: ds.font.board, fontWeight: 600 }}>
                                        {mesSalles.filter(Boolean).join(' · ')}
                                    </Typography>
                                </Stack>
                            );
                        })}
                    </Box>
                )}
            </Paper>
        </DashboardLayout>
    );
}
