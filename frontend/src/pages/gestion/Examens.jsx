import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Autocomplete,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Add, Delete, Edit, Groups, Publish } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ViolationsDialog from '../../components/planning/ViolationsDialog';
import EmptyState from '../../design-system/components/EmptyState';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { coursAPI, examenAPI, groupeAPI, salleAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { fetchAll } from '../../utils/fetchAll';
import { ds } from '../../design-system/tokens';

const hhmm = (h) => String(h || '').slice(0, 5);
const VIDE = { titre: '', cours: null, date: '', heure_debut: '09:00', heure_fin: '11:00', groupes: [], salles: [] };

/**
 * Examens (phase P5) : une épreuve par module et groupes, répartie sur des salles en capacité
 * d'examen ; surveillants affectés d'office (les moins sollicités d'abord) puis publication,
 * qui prévient surveillants et étudiants.
 */
export default function Examens() {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const [examens, setExamens] = useState([]);
    const [charge, setCharge] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ref, setRef] = useState({ cours: [], groupes: [], salles: [] });
    const [dialog, setDialog] = useState(null);
    const [violations, setViolations] = useState(null);

    const formatDate = useMemo(() => new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }), [i18n.language]);

    const charger = useCallback(async () => {
        try {
            const [liste, surveillances] = await Promise.all([examenAPI.getAll(), examenAPI.getChargeSurveillances()]);
            setExamens(liste);
            setCharge(surveillances);
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setLoading(false);
        }
    }, [t, toast]);

    useEffect(() => {
        charger();
        Promise.all([fetchAll(coursAPI.getAll), fetchAll(groupeAPI.getAll), fetchAll(salleAPI.getAll)])
            .then(([cours, groupes, salles]) => setRef({ cours, groupes, salles }))
            .catch(() => {});
    }, [charger]);

    const erreur = (error) => toast.error(error.response?.data?.error || error.response?.data?.errors?.[0]?.message || error.message);

    const ouvrir = (examen = null) =>
        setDialog(
            examen
                ? {
                      id: examen.id_session,
                      titre: examen.titre,
                      cours: ref.cours.find((c) => c.id_cours === examen.id_cours) ?? null,
                      date: examen.date,
                      heure_debut: hhmm(examen.heure_debut),
                      heure_fin: hhmm(examen.heure_fin),
                      groupes: ref.groupes.filter((g) => examen.groupes.some((x) => x.id_groupe === g.id_groupe)),
                      salles: ref.salles.filter((s) => examen.salles.some((x) => x.id_salle === s.id_salle)),
                  }
                : { ...VIDE }
        );

    const enregistrer = async (extra = {}) => {
        const corps = {
            titre: dialog.titre.trim(),
            id_cours: dialog.cours?.id_cours,
            date: dialog.date,
            heure_debut: dialog.heure_debut,
            heure_fin: dialog.heure_fin,
            groupes: dialog.groupes.map((g) => g.id_groupe),
            salles: dialog.salles.map((s) => ({ id_salle: s.id_salle })),
            ...extra,
        };
        try {
            const reponse = dialog.id ? await examenAPI.update(dialog.id, corps) : await examenAPI.create(corps);
            const manquants = reponse.violations?.filter((v) => v.code === 'surveillants_manquants').length;
            toast.success(manquants ? `${t('exams.saved')} · ${t('exams.needInvigilators')}` : t('exams.saved'));
            setDialog(null);
            setViolations(null);
            charger();
        } catch (error) {
            if (error.status === 409 && error.response?.data?.violations) {
                setViolations({ liste: error.response.data.violations, forcer: (justification) => enregistrer({ forcer: true, justification }) });
                return;
            }
            erreur(error);
        }
    };

    const action = async (fn, message) => {
        try {
            const reponse = await fn();
            toast.success(reponse?.message || message);
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    const champ = (nom) => (e) => setDialog((d) => ({ ...d, [nom]: e.target.value }));
    const effectif = dialog ? dialog.groupes.reduce((total, g) => total + (g.effectif || 0), 0) : 0;
    const places = dialog ? dialog.salles.reduce((total, s) => total + (s.capacite_examen ?? Math.floor(s.capacite / 2)), 0) : 0;

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 760 }}>
                        {t('exams.intro')}
                    </Typography>
                    <Button variant="contained" startIcon={<Add />} onClick={() => ouvrir()}>
                        {t('exams.add')}
                    </Button>
                </Box>

                {loading ? (
                    <TableSkeleton rows={5} />
                ) : examens.length === 0 ? (
                    <EmptyState title={t('exams.emptyTitle')} description={t('exams.emptyBody')} actionLabel={t('exams.add')} onAction={() => ouvrir()} />
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('resa.cols.when')}</TableCell>
                                    <TableCell>{t('exams.cols.exam')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('exams.cols.groups')}</TableCell>
                                    <TableCell>{t('exams.cols.rooms')}</TableCell>
                                    <TableCell align="right">{t('ref.rooms.cols.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {examens.map((e) => (
                                    <TableRow key={e.id_session} hover>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                {formatDate.format(new Date(`${e.date}T12:00:00`))}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: ds.font.board }}>
                                                {hhmm(e.heure_debut)}–{hhmm(e.heure_fin)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {e.titre}
                                                </Typography>
                                                {e.statut !== 'publiee' && <StateChip tone={e.statut === 'annulee' ? 'neutral' : 'info'}>{t(`exams.statuses.${e.statut}`)}</StateChip>}
                                            </Stack>
                                            <Typography variant="caption" color="text.secondary">
                                                {e.cours?.code_cours} · {e.cours?.nom_cours}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{e.groupes.map((g) => g.nom_groupe).join(', ')}</TableCell>
                                        <TableCell>
                                            {e.salles.map((s) => {
                                                const surveillants = e.surveillances.filter((x) => x.id_salle === s.id_salle);
                                                return (
                                                    <Typography key={s.id_salle} variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                                                        {s.salle?.nom_salle} · {t('exams.students', { count: s.effectif })} ·{' '}
                                                        <Box component="span" sx={{ color: surveillants.length ? 'text.secondary' : 'warning.main' }}>
                                                            {surveillants.length ? surveillants.map((x) => `${x.surveillant?.prenom?.[0] ?? ''}. ${x.surveillant?.nom ?? ''}`).join(', ') : t('exams.noInvigilator')}
                                                        </Box>
                                                    </Typography>
                                                );
                                            })}
                                        </TableCell>
                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                            {e.statut !== 'annulee' && (
                                                <>
                                                    <IconButton size="small" onClick={() => action(() => examenAPI.autoSurveillants(e.id_session), t('exams.invigilatorsSet'))} aria-label={t('exams.autoInvigilators')} title={t('exams.autoInvigilators')}>
                                                        <Groups fontSize="small" />
                                                    </IconButton>
                                                    {e.statut === 'brouillon' && (
                                                        <IconButton size="small" onClick={() => action(() => examenAPI.publier(e.id_session), t('exams.published'))} aria-label={t('exams.publish')} title={t('exams.publish')}>
                                                            <Publish fontSize="small" />
                                                        </IconButton>
                                                    )}
                                                    <IconButton size="small" onClick={() => ouvrir(e)} aria-label={t('ref.common.editItem', { name: e.titre })}>
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => action(() => examenAPI.delete(e.id_session))} aria-label={t('ref.common.deleteItem', { name: e.titre })}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {charge.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                            {t('exams.balance')}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {charge.map((c) => `${c.prenom?.[0] ?? ''}. ${c.nom} (${c.surveillances})`).join(' · ')}
                        </Typography>
                    </Box>
                )}
            </Paper>

            <Dialog open={Boolean(dialog)} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        enregistrer();
                    }}
                >
                    <DialogTitle>{dialog?.id ? t('exams.edit') : t('exams.add')}</DialogTitle>
                    <DialogContent>
                        {dialog && (
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <TextField label={t('exams.fields.title')} value={dialog.titre} onChange={champ('titre')} required />
                                <Autocomplete
                                    options={ref.cours}
                                    value={dialog.cours}
                                    onChange={(_, v) => setDialog((d) => ({ ...d, cours: v, titre: d.titre || (v ? t('exams.defaultTitle', { name: v.nom_cours }) : '') }))}
                                    getOptionLabel={(c) => `${c.code_cours} · ${c.nom_cours}`}
                                    isOptionEqualToValue={(a, b) => a.id_cours === b.id_cours}
                                    renderInput={(params) => <TextField {...params} label={t('exams.fields.module')} required />}
                                />
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField type="date" label={t('resa.fields.date')} value={dialog.date} onChange={champ('date')} InputLabelProps={{ shrink: true }} required fullWidth />
                                    <TextField type="time" label={t('resa.fields.start')} value={dialog.heure_debut} onChange={champ('heure_debut')} InputLabelProps={{ shrink: true }} required />
                                    <TextField type="time" label={t('resa.fields.end')} value={dialog.heure_fin} onChange={champ('heure_fin')} InputLabelProps={{ shrink: true }} required />
                                </Stack>
                                <Autocomplete
                                    multiple
                                    options={ref.groupes}
                                    value={dialog.groupes}
                                    onChange={(_, v) => setDialog((d) => ({ ...d, groupes: v }))}
                                    getOptionLabel={(g) => `${g.nom_groupe} (${g.effectif})`}
                                    isOptionEqualToValue={(a, b) => a.id_groupe === b.id_groupe}
                                    renderInput={(params) => <TextField {...params} label={t('exams.fields.groups')} />}
                                />
                                <Autocomplete
                                    multiple
                                    options={ref.salles}
                                    value={dialog.salles}
                                    onChange={(_, v) => setDialog((d) => ({ ...d, salles: v }))}
                                    getOptionLabel={(s) => `${s.nom_salle} · ${s.capacite_examen ?? Math.floor(s.capacite / 2)} ${t('exams.examSeats')}`}
                                    isOptionEqualToValue={(a, b) => a.id_salle === b.id_salle}
                                    renderInput={(params) => <TextField {...params} label={t('exams.fields.rooms')} helperText={t('exams.seatsHelp', { students: effectif, seats: places })} />}
                                />
                            </Stack>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialog(null)}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained" disabled={!dialog?.cours || !dialog?.groupes.length || !dialog?.salles.length}>
                            {t('common.save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <ViolationsDialog violations={violations?.liste} onClose={() => setViolations(null)} onForcer={violations?.forcer} />
        </DashboardLayout>
    );
}
