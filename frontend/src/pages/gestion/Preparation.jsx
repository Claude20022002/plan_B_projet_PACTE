import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Box, Button, LinearProgress, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked, Timelapse } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import EmptyState from '../../design-system/components/EmptyState';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { calendrierAPI, preparationAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { ds, lineColor } from '../../design-system/tokens';

const ICONES = {
    fait: <CheckCircle fontSize="small" sx={{ color: 'success.main' }} />,
    en_cours: <Timelapse fontSize="small" sx={{ color: 'text.secondary' }} />,
    a_faire: <RadioButtonUnchecked fontSize="small" sx={{ color: 'text.disabled' }} />,
};
// Étapes menées par l'administration (les autres par le responsable de filière)
const ETAPES_ADMIN = new Set(['calendrier', 'generation', 'publication']);

/**
 * Assistant « Préparer le semestre » (phase P4) : pour chaque filière, les 8 étapes et leur
 * avancement, calculés à partir des données ; chaque étape mène à l'écran où la faire avancer.
 */
export default function Preparation() {
    const { t } = useTranslation();
    const toast = useToast();
    const navigate = useNavigate();
    const { user } = useAuth();
    const admin = user?.role === 'admin';
    const [periodes, setPeriodes] = useState([]);
    const [idPeriode, setIdPeriode] = useState('');
    const [etat, setEtat] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        calendrierAPI
            .getAnnees()
            .then((annees) => {
                const liste = annees.flatMap((a) => a.periodes.map((p) => ({ ...p, libelle_annee: a.libelle, active: a.active })));
                setPeriodes(liste);
                const prochaine = liste.find((p) => p.active && p.date_fin >= new Date().toISOString().slice(0, 10)) || liste[0];
                setIdPeriode(prochaine?.id_periode ?? '');
                if (!prochaine) setLoading(false);
            })
            .catch(() => toast.error(t('common.errorLoad')));
    }, [t, toast]);

    const charger = useCallback(async () => {
        if (!idPeriode) return;
        setLoading(true);
        try {
            setEtat(await preparationAPI.etat(idPeriode));
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setLoading(false);
        }
    }, [idPeriode, t, toast]);

    useEffect(() => {
        charger();
    }, [charger]);

    const relancer = async (filiere) => {
        try {
            const { relances } = await preparationAPI.relancer({ id_periode: idPeriode, id_filiere: filiere.id_filiere });
            toast.success(t('prep.reminded', { count: relances }));
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        }
    };

    const detail = (etape) => {
        const d = etape.detail;
        switch (etape.cle) {
            case 'calendrier':
                return t('prep.details.calendar', { holidays: d.feries, exams: d.examens, pending: d.a_confirmer });
            case 'maquette':
                return t('prep.details.curriculum', { modules: d.modules, missing: d.sans_composante });
            case 'groupes':
                return d.annees_sans_promotion.length ? t('prep.details.groupsMissing', { years: d.annees_sans_promotion.map((a) => `${a}A`).join(', ') }) : t('prep.details.groupsOk', { count: d.annees_attendues.length });
            case 'services':
                return t('prep.details.services', { assigned: d.pourvus, total: d.enseignements, pending: d.a_accepter });
            case 'disponibilites':
                return d.sans_disponibilite.length ? t('prep.details.availabilityMissing', { names: d.sans_disponibilite.map((v) => `${v.prenom[0]}. ${v.nom}`).join(', ') }) : t('prep.details.availabilityOk', { count: d.vacataires });
            case 'generation':
                return t('prep.details.generation', { planned: d.planifies, sessions: d.seances });
            case 'revue':
                return t('prep.details.review', { count: d.conflits });
            case 'publication':
                return t('prep.details.publication', { count: d.confirmees });
            default:
                return '';
        }
    };

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <TextField select size="small" label={t('ref.teaching.period')} value={idPeriode} onChange={(e) => setIdPeriode(e.target.value)} sx={{ minWidth: 200 }}>
                        {periodes.map((p) => (
                            <MenuItem key={p.id_periode} value={p.id_periode}>
                                {p.libelle_annee} · {p.code}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 820 }}>
                    {t('prep.intro')}
                </Typography>

                {loading ? (
                    <TableSkeleton rows={6} />
                ) : !etat || etat.filieres.length === 0 ? (
                    <EmptyState title={t('prep.emptyTitle')} description={t('prep.emptyBody')} />
                ) : (
                    <Stack spacing={2}>
                        {etat.filieres.map(({ filiere, avancement, etapes }) => (
                            <Box key={filiere.id_filiere} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: `${ds.radius.xs}px` }}>
                                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                                    <Box component="span" aria-hidden sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: lineColor(filiere.id_filiere), flexShrink: 0 }} />
                                    <Typography sx={{ fontFamily: ds.font.board, fontWeight: 700, letterSpacing: '0.04em' }}>{filiere.code_filiere}</Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 0 }} noWrap>
                                        {filiere.nom_filiere}
                                    </Typography>
                                    <Box sx={{ width: 120, display: { xs: 'none', sm: 'block' } }}>
                                        <LinearProgress variant="determinate" value={avancement} sx={{ height: 6, borderRadius: 1 }} />
                                    </Box>
                                    <Typography sx={{ fontFamily: ds.font.board, fontWeight: 600, fontVariantNumeric: 'tabular-nums', minWidth: 44, textAlign: 'right' }}>{avancement} %</Typography>
                                </Stack>
                                {etapes.map((etape, i) => (
                                    <Stack key={etape.cle} direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 1.5 }} alignItems={{ sm: 'center' }} sx={{ px: 1.5, py: 0.75, borderBottom: i < etapes.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 230 }}>
                                            {ICONES[etape.etat]}
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {i + 1}. {t(`prep.steps.${etape.cle}`)}
                                            </Typography>
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                                            {detail(etape)}
                                            {ETAPES_ADMIN.has(etape.cle) && ` · ${t('prep.adminStep')}`}
                                        </Typography>
                                        <Stack direction="row" spacing={1}>
                                            {etape.cle === 'disponibilites' && etape.detail.sans_disponibilite.length > 0 && (
                                                <Button size="small" variant="outlined" onClick={() => relancer(filiere)}>
                                                    {t('prep.remind')}
                                                </Button>
                                            )}
                                            {(admin || !ETAPES_ADMIN.has(etape.cle)) && etape.etat !== 'fait' && (
                                                <Button size="small" onClick={() => navigate(etape.lien)}>
                                                    {t('prep.open')}
                                                </Button>
                                            )}
                                        </Stack>
                                    </Stack>
                                ))}
                            </Box>
                        ))}
                    </Stack>
                )}
            </Paper>
        </DashboardLayout>
    );
}
