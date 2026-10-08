import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    LinearProgress,
    MenuItem,
    Paper,
    Stack,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    TextField,
    Typography,
} from '@mui/material';
import { PlayArrow, Stop } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import EmptyState from '../../design-system/components/EmptyState';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { calendrierAPI, filiereAPI, generationAutomatiqueAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { fetchAll } from '../../utils/fetchAll';
import { ds } from '../../design-system/tokens';

const DUREES = [30, 60, 120, 300];
const TON_STATUT = { running: 'info', completed: 'success', failed: 'danger' };

/**
 * Génération automatique (phase E) : la semaine type est calculée par le service Timefold, puis
 * déployée sur le semestre sous les règles de planification. La page suit l'avancement, affiche
 * le rapport (enseignements exclus ou incomplets, dates sautées) et permet de revenir à une
 * version précédente.
 */
export default function GenerationAutomatique() {
    const { t, i18n } = useTranslation();
    const [onglet, setOnglet] = useState(0);
    const dateHeure = useMemo(() => new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'medium', timeStyle: 'short' }), [i18n.language]);

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Tabs value={onglet} onChange={(_, v) => setOnglet(v)} sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Tab label={t('gen.tabs.run')} />
                    <Tab label={t('gen.tabs.versions')} />
                </Tabs>
                {onglet === 0 ? <Lancement dateHeure={dateHeure} /> : <Versions dateHeure={dateHeure} />}
            </Paper>
        </DashboardLayout>
    );
}

function Lancement({ dateHeure }) {
    const { t } = useTranslation();
    const toast = useToast();
    const [periodes, setPeriodes] = useState([]);
    const [idPeriode, setIdPeriode] = useState('');
    const [filieres, setFilieres] = useState([]);
    const [choisies, setChoisies] = useState([]);
    const [duree, setDuree] = useState(60);
    const [session, setSession] = useState(null);
    const [chargement, setChargement] = useState(true);
    const [envoi, setEnvoi] = useState(false);
    const minuterie = useRef(null);

    const suivre = useCallback(
        (id) => {
            clearTimeout(minuterie.current);
            const tour = async () => {
                try {
                    const s = await generationAutomatiqueAPI.session(id);
                    setSession(s);
                    if (s.status === 'running') minuterie.current = setTimeout(tour, 2000);
                    else if (s.status === 'completed') toast.success(s.last_message);
                    else toast.error(s.last_message);
                } catch {
                    minuterie.current = setTimeout(tour, 5000);
                }
            };
            tour();
        },
        [toast]
    );

    useEffect(() => {
        Promise.all([calendrierAPI.getAnnees(), fetchAll(filiereAPI.getAll), generationAutomatiqueAPI.sessions()])
            .then(([annees, toutes, sessions]) => {
                const liste = annees.flatMap((a) => a.periodes.map((p) => ({ ...p, libelle_annee: a.libelle, active: a.active })));
                setPeriodes(liste);
                setFilieres(toutes);
                const today = new Date().toISOString().slice(0, 10);
                const courante = liste.find((p) => p.active && p.date_fin >= today) || liste.find((p) => p.active) || liste[0];
                setIdPeriode(courante?.id_periode ?? '');
                // Reprendre le suivi d'une génération en cours, sinon afficher le dernier rapport
                const derniere = sessions.find((s) => s.config?.moteur === 'timefold');
                if (derniere?.status === 'running') suivre(derniere.id_generation_session);
                else setSession(derniere ?? null);
            })
            .catch(() => toast.error(t('common.errorLoad')))
            .finally(() => setChargement(false));
        return () => clearTimeout(minuterie.current);
    }, [t, toast, suivre]);

    const lancer = async () => {
        setEnvoi(true);
        try {
            const { session: s } = await generationAutomatiqueAPI.generer({ id_periode: idPeriode, id_filieres: choisies, duree_secondes: duree });
            setSession(s);
            suivre(s.id_generation_session);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setEnvoi(false);
        }
    };

    const arreter = async () => {
        try {
            const { message } = await generationAutomatiqueAPI.arreter(session.id_generation_session);
            toast.info(message);
        } catch (error) {
            toast.error(error.message);
        }
    };

    const enCours = session?.status === 'running';

    if (chargement) return <TableSkeleton rows={6} />;

    return (
        <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 820 }}>
                {t('gen.intro')}
            </Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems={{ md: 'flex-start' }}>
                <TextField select size="small" label={t('ref.teaching.period')} value={idPeriode} onChange={(e) => setIdPeriode(e.target.value)} sx={{ minWidth: 200 }} disabled={enCours}>
                    {periodes.map((p) => (
                        <MenuItem key={p.id_periode} value={p.id_periode}>
                            {p.libelle_annee} · {p.code}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    size="small"
                    label={t('gen.programs')}
                    value={choisies}
                    onChange={(e) => setChoisies(e.target.value)}
                    sx={{ minWidth: 260, maxWidth: { md: 420 } }}
                    disabled={enCours}
                    helperText={t('gen.programsHelp')}
                    InputLabelProps={{ shrink: true }}
                    SelectProps={{
                        multiple: true,
                        displayEmpty: true,
                        renderValue: (ids) => (ids.length ? filieres.filter((f) => ids.includes(f.id_filiere)).map((f) => f.code_filiere).join(', ') : t('ref.curriculum.allPrograms')),
                    }}
                >
                    {filieres.map((f) => (
                        <MenuItem key={f.id_filiere} value={f.id_filiere}>
                            {f.code_filiere} · {f.nom_filiere}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField select size="small" label={t('gen.duration')} value={duree} onChange={(e) => setDuree(e.target.value)} sx={{ minWidth: 140 }} disabled={enCours}>
                    {DUREES.map((d) => (
                        <MenuItem key={d} value={d}>
                            {t('gen.seconds', { count: d })}
                        </MenuItem>
                    ))}
                </TextField>
                {enCours ? (
                    <Button variant="outlined" color="inherit" startIcon={<Stop />} onClick={arreter}>
                        {t('gen.stop')}
                    </Button>
                ) : (
                    <Button variant="contained" startIcon={<PlayArrow />} onClick={lancer} disabled={!idPeriode || envoi}>
                        {t('gen.start')}
                    </Button>
                )}
            </Stack>

            {!session ? (
                <EmptyState title={t('gen.emptyTitle')} description={t('gen.emptyBody')} />
            ) : (
                <Box sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                        <Typography variant="subtitle2">{t('gen.lastRun', { date: dateHeure.format(new Date(session.createdAt)) })}</Typography>
                        <StateChip tone={TON_STATUT[session.status]}>{t(`gen.status.${session.status}`)}</StateChip>
                    </Stack>
                    {enCours && <LinearProgress variant="determinate" value={session.progress || 0} sx={{ height: 6, borderRadius: 1, mb: 1, bgcolor: 'divider' }} />}
                    <Typography variant="body2" color={session.status === 'failed' ? 'error' : 'text.secondary'} sx={{ mb: 2 }}>
                        {session.last_message}
                    </Typography>
                    {session.status === 'completed' && session.config?.rapport && <Rapport rapport={session.config.rapport} />}
                </Box>
            )}
        </>
    );
}

function Rapport({ rapport }) {
    const { t, i18n } = useTranslation();
    const nombre = useMemo(() => new Intl.NumberFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 1 }), [i18n.language]);
    const incomplets = rapport.enseignements.filter((e) => !e.complet);
    const avertissements = rapport.avertissements ?? [];

    return (
        <Stack spacing={2.5}>
            {avertissements.length > 0 && (
                <Box sx={{ borderLeft: '3px solid', borderColor: 'warning.main', pl: 1.5 }}>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        {t('gen.report.warningsTitle')}
                    </Typography>
                    {avertissements.map((a) => (
                        <Typography key={a.id_user} variant="body2" color="text.secondary">
                            {t('gen.report.notEnoughAvailability', { name: a.enseignant, sessions: a.seances, free: a.creneaux_libres })}
                        </Typography>
                    ))}
                </Box>
            )}
            <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                <Chiffre libelle={t('gen.report.created')} valeur={rapport.seances_creees} />
                <Chiffre libelle={t('gen.report.teachings')} valeur={rapport.enseignements.length} />
                <Chiffre libelle={t('gen.report.incomplete')} valeur={incomplets.length} alerte={incomplets.length > 0} />
                <Chiffre libelle={t('gen.report.excluded')} valeur={rapport.exclus.length} alerte={rapport.exclus.length > 0} />
                <Chiffre libelle={t('gen.report.hard')} valeur={rapport.regles_dures_enfreintes ?? '-'} alerte={rapport.regles_dures_enfreintes < 0} />
            </Stack>

            {rapport.lecons_en_conflit.length > 0 && (
                <Typography variant="body2" color="error">
                    {t('gen.report.conflicts', { modules: [...new Set(rapport.lecons_en_conflit)].join(', ') })}
                </Typography>
            )}

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>{t('ref.teaching.cols.module')}</TableCell>
                            <TableCell align="right">{t('gen.report.hours')}</TableCell>
                            <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('gen.report.sessions')}</TableCell>
                            <TableCell>{t('gen.report.skipped')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rapport.enseignements.map((e) => (
                            <TableRow key={e.id_enseignement} hover>
                                <TableCell>
                                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {e.module}
                                        </Typography>
                                        <Typography component="span" sx={{ fontFamily: ds.font.board, fontWeight: 600 }}>
                                            {e.type}
                                        </Typography>
                                        {e.lecons_non_placees > 0 ? (
                                            <StateChip tone="danger" title={t('gen.report.unplacedTitle')}>{t('gen.report.unplacedChip')}</StateChip>
                                        ) : (
                                            !e.complet && <StateChip tone="warning">{t('gen.report.incompleteChip')}</StateChip>
                                        )}
                                    </Stack>
                                </TableCell>
                                <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                                    {nombre.format(e.heures_planifiees)} / {nombre.format(e.heures_prevues)} h
                                </TableCell>
                                <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, fontVariantNumeric: 'tabular-nums' }}>{e.seances}</TableCell>
                                <TableCell>
                                    {e.sautees.length === 0 ? (
                                        <Typography variant="body2" color="text.secondary">-</Typography>
                                    ) : (
                                        e.sautees.map((s) => (
                                            <Typography key={s.date} variant="caption" component="div" color="text.secondary">
                                                <Box component="span" sx={{ fontVariantNumeric: 'tabular-nums', color: 'text.primary' }}>{s.date}</Box> · {s.message}
                                            </Typography>
                                        ))
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {rapport.exclus.length > 0 && (
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        {t('gen.report.excludedTitle')}
                    </Typography>
                    {rapport.exclus.map((x) => (
                        <Typography key={x.id_enseignement} variant="body2" color="text.secondary">
                            {x.module} {x.type} · {t(`gen.reasons.${x.raison}`)}
                        </Typography>
                    ))}
                </Box>
            )}

            {rapport.violations.length > 0 && (
                <Box>
                    <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        {t('gen.report.violationsTitle')}
                    </Typography>
                    {rapport.violations.map((v) => (
                        <Stack key={v.contrainte} direction="row" spacing={1} alignItems="center" sx={{ py: 0.25 }}>
                            <StateChip tone={v.dur < 0 ? 'danger' : 'neutral'}>{t(v.dur < 0 ? 'gen.report.hardRule' : 'gen.report.softRule')}</StateChip>
                            <Typography variant="body2" color="text.secondary">
                                {v.contrainte} · {t('gen.report.times', { count: v.nombre })}
                            </Typography>
                        </Stack>
                    ))}
                </Box>
            )}
        </Stack>
    );
}

function Chiffre({ libelle, valeur, alerte = false }) {
    return (
        <Box>
            <Typography sx={{ fontFamily: ds.font.board, fontWeight: 600, fontSize: '1.5rem', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', color: alerte ? 'warning.dark' : 'text.primary' }}>{valeur}</Typography>
            <Typography variant="caption" color="text.secondary">
                {libelle}
            </Typography>
        </Box>
    );
}

function Versions({ dateHeure }) {
    const { t } = useTranslation();
    const toast = useToast();
    const [versions, setVersions] = useState([]);
    const [chargement, setChargement] = useState(true);
    const [aReactiver, setAReactiver] = useState(null);

    const charger = useCallback(async () => {
        setChargement(true);
        try {
            setVersions((await generationAutomatiqueAPI.snapshots()).snapshots);
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setChargement(false);
        }
    }, [t, toast]);

    useEffect(() => {
        charger();
    }, [charger]);

    const reactiver = async () => {
        try {
            await generationAutomatiqueAPI.rollbackSnapshot(aReactiver.id_snapshot);
            toast.success(t('gen.versions.done'));
            setAReactiver(null);
            charger();
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (chargement) return <TableSkeleton rows={6} />;

    return (
        <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 820 }}>
                {t('gen.versions.intro')}
            </Typography>
            {versions.length === 0 ? (
                <EmptyState title={t('gen.versions.emptyTitle')} description={t('gen.versions.emptyBody')} />
            ) : (
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>{t('gen.versions.cols.label')}</TableCell>
                                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('gen.versions.cols.date')}</TableCell>
                                <TableCell align="right">{t('gen.versions.cols.sessions')}</TableCell>
                                <TableCell align="right" />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {versions.map((v) => (
                                <TableRow key={v.id_snapshot} hover>
                                    <TableCell>
                                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {v.label}
                                            </Typography>
                                            {v.is_active && <StateChip tone="success">{t('gen.versions.active')}</StateChip>}
                                        </Stack>
                                        {v.admin_createur && (
                                            <Typography variant="caption" color="text.secondary">
                                                {v.admin_createur.prenom} {v.admin_createur.nom}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, whiteSpace: 'nowrap' }}>{dateHeure.format(new Date(v.createdAt))}</TableCell>
                                    <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>{v.nb_affectations ?? 0}</TableCell>
                                    <TableCell align="right">
                                        <Button size="small" onClick={() => setAReactiver(v)}>
                                            {t('gen.versions.restore')}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={Boolean(aReactiver)} onClose={() => setAReactiver(null)} maxWidth="xs" fullWidth>
                <DialogTitle>{t('gen.versions.confirmTitle')}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2">{t('gen.versions.confirmBody', { label: aReactiver?.label ?? '' })}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAReactiver(null)}>{t('common.cancel')}</Button>
                    <Button variant="contained" onClick={reactiver}>
                        {t('gen.versions.restore')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
