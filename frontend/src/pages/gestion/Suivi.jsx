import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, LinearProgress, MenuItem, Paper, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Typography } from '@mui/material';
import { Download, Refresh } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import EmptyState from '../../design-system/components/EmptyState';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { calendrierAPI, filiereAPI, suiviAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { fetchAll } from '../../utils/fetchAll';
import { filieresGerables } from '../../utils/droits';
import { ds } from '../../design-system/tokens';

const moisCourant = () => new Date().toISOString().slice(0, 7);

/**
 * Suivi du réalisé (phase P7) : avancement de chaque enseignement face à son rythme (alerte de
 * retard), heures réalisées par enseignant sur un mois et export CSV des vacataires.
 */
export default function Suivi() {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const admin = user?.role === 'admin';
    const [onglet, setOnglet] = useState(0);
    const nombre = useMemo(() => new Intl.NumberFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 1 }), [i18n.language]);

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                {admin && (
                    <Tabs value={onglet} onChange={(_, v) => setOnglet(v)} sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Tab label={t('tracking.tabs.progress')} />
                        <Tab label={t('tracking.tabs.hours')} />
                    </Tabs>
                )}
                {onglet === 0 ? <Avancement nombre={nombre} user={user} /> : <Heures nombre={nombre} />}
            </Paper>
        </DashboardLayout>
    );
}

function Avancement({ nombre, user }) {
    const { t } = useTranslation();
    const toast = useToast();
    const [periodes, setPeriodes] = useState([]);
    const [idPeriode, setIdPeriode] = useState('');
    const [filieres, setFilieres] = useState([]);
    const [filiere, setFiliere] = useState('');
    const [lignes, setLignes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([calendrierAPI.getAnnees(), fetchAll(filiereAPI.getAll)])
            .then(([annees, toutes]) => {
                const liste = annees.flatMap((a) => a.periodes.map((p) => ({ ...p, libelle_annee: a.libelle, active: a.active })));
                setPeriodes(liste);
                setFilieres(filieresGerables(toutes, user));
                const today = new Date().toISOString().slice(0, 10);
                const courante = liste.find((p) => p.active && p.date_debut <= today && p.date_fin >= today) || liste.find((p) => p.active) || liste[0];
                setIdPeriode(courante?.id_periode ?? '');
                if (!courante) setLoading(false);
            })
            .catch(() => toast.error(t('common.errorLoad')));
    }, [t, toast, user]);

    const charger = useCallback(async () => {
        if (!idPeriode) return;
        setLoading(true);
        try {
            setLignes(await suiviAPI.modules({ id_periode: idPeriode, id_filiere: filiere }));
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setLoading(false);
        }
    }, [idPeriode, filiere, t, toast]);

    useEffect(() => {
        charger();
    }, [charger]);

    const enRetard = lignes.filter((l) => l.en_retard).length;

    return (
        <>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 1.5 }}>
                <TextField select size="small" label={t('ref.teaching.period')} value={idPeriode} onChange={(e) => setIdPeriode(e.target.value)} sx={{ minWidth: 200 }}>
                    {periodes.map((p) => (
                        <MenuItem key={p.id_periode} value={p.id_periode}>
                            {p.libelle_annee} · {p.code}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField select size="small" label={t('ref.curriculum.program')} value={filiere} onChange={(e) => setFiliere(e.target.value)} sx={{ minWidth: 220 }} SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }}>
                    <MenuItem value="">{t('ref.curriculum.allPrograms')}</MenuItem>
                    {filieres.map((f) => (
                        <MenuItem key={f.id_filiere} value={f.id_filiere}>
                            {f.code_filiere} · {f.nom_filiere}
                        </MenuItem>
                    ))}
                </TextField>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 820 }}>
                {t('tracking.intro')} {enRetard > 0 && <strong>{t('tracking.late', { count: enRetard })}</strong>}
            </Typography>
            {loading ? (
                <TableSkeleton rows={8} />
            ) : lignes.length === 0 ? (
                <EmptyState title={t('tracking.emptyTitle')} description={t('tracking.emptyBody')} />
            ) : (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('ref.teaching.cols.module')}</TableCell>
                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.teaching.cols.groups')}</TableCell>
                                <TableCell sx={{ minWidth: 180 }}>{t('tracking.cols.progress')}</TableCell>
                                <TableCell align="right">{t('tracking.cols.done')}</TableCell>
                                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('tracking.cols.planned')}</TableCell>
                                <TableCell align="right">{t('tracking.cols.left')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {lignes.map((l) => (
                                <TableRow key={l.id_enseignement} hover>
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {l.module.nom_cours}
                                            </Typography>
                                            <Typography component="span" sx={{ fontFamily: ds.font.board, fontWeight: 600 }}>
                                                {l.type}
                                            </Typography>
                                            {l.en_retard && <StateChip tone="warning" title={t('tracking.lateTitle', { expected: nombre.format(l.heures_attendues) })}>{t('tracking.lateChip')}</StateChip>}
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary">
                                            {l.module.code_cours} · {l.module.filiere}
                                            {l.non_planifie > 0 && ` · ${t('tracking.unplanned', { hours: nombre.format(l.non_planifie) })}`}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{l.groupes.join(', ')}</TableCell>
                                    <TableCell>
                                        <Box sx={{ position: 'relative' }}>
                                            <LinearProgress variant="determinate" value={Math.min(100, (100 * l.heures_realisees) / (l.heures_prevues || 1))} sx={{ height: 6, borderRadius: 1, bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }} />
                                            {/* Repère du rythme attendu à ce jour */}
                                            <Box aria-hidden sx={{ position: 'absolute', top: -3, bottom: -3, width: 2, bgcolor: 'text.primary', left: `${Math.min(100, (100 * l.heures_attendues) / (l.heures_prevues || 1))}%` }} />
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                        {nombre.format(l.heures_realisees)} / {nombre.format(l.heures_prevues)} h
                                    </TableCell>
                                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, fontVariantNumeric: 'tabular-nums' }}>{nombre.format(l.heures_planifiees)} h</TableCell>
                                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{nombre.format(l.reste)} h</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </>
    );
}

function Heures({ nombre }) {
    const { t } = useTranslation();
    const toast = useToast();
    const [mois, setMois] = useState(moisCourant());
    const [lignes, setLignes] = useState([]);
    const [loading, setLoading] = useState(true);

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            setLignes(await suiviAPI.enseignants(mois));
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setLoading(false);
        }
    }, [mois, t, toast]);

    useEffect(() => {
        charger();
    }, [charger]);

    const actualiser = async () => {
        try {
            const { realisees } = await suiviAPI.actualiser();
            toast.success(t('tracking.refreshed', { count: realisees }));
            charger();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const exporter = async () => {
        try {
            await suiviAPI.exportVacataires(mois);
        } catch (error) {
            toast.error(error.message);
        }
    };

    return (
        <>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <TextField type="month" size="small" label={t('tracking.month')} value={mois} onChange={(e) => setMois(e.target.value)} InputLabelProps={{ shrink: true }} />
                <Stack direction="row" spacing={1}>
                    <Button startIcon={<Refresh />} onClick={actualiser}>
                        {t('tracking.refresh')}
                    </Button>
                    <Button variant="outlined" startIcon={<Download />} onClick={exporter}>
                        {t('tracking.exportVisiting')}
                    </Button>
                </Stack>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 820 }}>
                {t('tracking.hoursIntro')}
            </Typography>
            {loading ? (
                <TableSkeleton rows={6} />
            ) : lignes.length === 0 ? (
                <EmptyState title={t('tracking.noHoursTitle')} description={t('tracking.noHoursBody')} />
            ) : (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('ref.staff.cols.teacher')}</TableCell>
                                <TableCell>{t('ref.staff.cols.status')}</TableCell>
                                <TableCell align="right">{t('tracking.cols.done')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {lignes.map((l) => (
                                <TableRow key={l.id_user} hover>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {l.nom} {l.prenom}
                                        </Typography>
                                        {l.entreprise && (
                                            <Typography variant="caption" color="text.secondary">
                                                {l.entreprise}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>{t(`ref.staff.statuses.${l.statut}`)}</TableCell>
                                    <TableCell align="right" sx={{ fontFamily: ds.font.board, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                                        {nombre.format(l.heures_realisees)} h
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </>
    );
}
