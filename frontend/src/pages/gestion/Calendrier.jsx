import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { Add, Delete, Edit, EventAvailable, Flag } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../design-system/components/EmptyState';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { calendrierAPI, campusAPI, evenementAPI, filiereAPI, groupeAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const TYPES_EVENEMENT = ['vacances', 'examen', 'ferie', 'ramadan', 'stage', 'reunion', 'formation', 'autre'];
const PORTEES = ['etablissement', 'campus', 'filiere', 'niveau', 'groupe'];

const ANNEE_VIDE = { libelle: '', date_debut: '', date_fin: '', active: false };
const PERIODE_VIDE = { code: 'S1', libelle: '', date_debut: '', date_fin: '', nb_semaines: 16 };
const EVENEMENT_VIDE = {
    titre: '',
    description: '',
    date_debut: '',
    date_fin: '',
    type_evenement: 'vacances',
    bloque_affectations: true,
    portee: 'etablissement',
    id_cible: '',
    niveau: '',
    heure_debut: '',
    heure_fin: '',
};

const hhmm = (heure) => (heure ? String(heure).slice(0, 5) : '');

// Le type est une catégorie, pas un état : pastille neutre (le rouge et l'orange restent aux états).
// Seul le Ramadan se distingue, en marine voilé, car il change la grille horaire.
const toneType = (type) => (type === 'ramadan' ? 'info' : 'neutral');

export default function Calendrier() {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const [annees, setAnnees] = useState([]);
    const [idAnnee, setIdAnnee] = useState(null);
    const [evenements, setEvenements] = useState([]);
    const [aConfirmerSeulement, setAConfirmerSeulement] = useState(false);
    const [loading, setLoading] = useState(true);
    const [cibles, setCibles] = useState({ campus: [], filieres: [], groupes: [] });
    const [anneeDialog, setAnneeDialog] = useState({ open: false, editing: null, form: ANNEE_VIDE });
    const [periodeDialog, setPeriodeDialog] = useState({ open: false, editing: null, form: PERIODE_VIDE });
    const [evenementDialog, setEvenementDialog] = useState({ open: false, editing: null, form: EVENEMENT_VIDE });
    const [confirmation, setConfirmation] = useState({ open: false, evenement: null, date_debut: '', date_fin: '' });
    const [aSupprimer, setASupprimer] = useState(null);

    const annee = useMemo(() => annees.find((a) => a.id_annee === idAnnee) || null, [annees, idAnnee]);

    const formatDate = useCallback(
        (date) =>
            new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
                new Date(`${date}T12:00:00`)
            ),
        [i18n.language]
    );
    const plage = (debut, fin) => (debut === fin ? formatDate(debut) : `${formatDate(debut)} → ${formatDate(fin)}`);

    const chargerAnnees = useCallback(async () => {
        const liste = await calendrierAPI.getAnnees();
        setAnnees(liste);
        setIdAnnee((courant) => (liste.some((a) => a.id_annee === courant) ? courant : (liste.find((a) => a.active) || liste[0])?.id_annee ?? null));
        return liste;
    }, []);

    const chargerEvenements = useCallback(async () => {
        if (!annee) {
            setEvenements([]);
            return;
        }
        const liste = await evenementAPI.getAll({ date_from: annee.date_debut, date_to: annee.date_fin });
        setEvenements(liste);
    }, [annee]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                await chargerAnnees();
                const [campus, filieres, groupes] = await Promise.all([
                    campusAPI.getAll(),
                    filiereAPI.getAll({ limit: 100 }),
                    groupeAPI.getAll({ limit: 100 }),
                ]);
                setCibles({ campus: campus || [], filieres: filieres.data || filieres || [], groupes: groupes.data || groupes || [] });
            } catch {
                toast.error(t('common.errorLoad'));
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        chargerEvenements().catch(() => toast.error(t('common.errorLoad')));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chargerEvenements]);

    const erreur = (error) => toast.error(error.response?.data?.error || error.response?.data?.errors?.[0]?.message || error.message);

    // ── Années ────────────────────────────────────────────────────────────
    const enregistrerAnnee = async (event) => {
        event.preventDefault();
        try {
            if (anneeDialog.editing) {
                await calendrierAPI.updateAnnee(anneeDialog.editing.id_annee, anneeDialog.form);
            } else {
                const { annee: creee } = await calendrierAPI.createAnnee(anneeDialog.form);
                setIdAnnee(creee.id_annee);
            }
            toast.success(t('ref.calendar.yearSaved'));
            setAnneeDialog({ open: false, editing: null, form: ANNEE_VIDE });
            await chargerAnnees();
        } catch (error) {
            erreur(error);
        }
    };

    const ajouterFeries = async () => {
        try {
            const resultat = await calendrierAPI.genererFeries(annee.id_annee);
            toast.success(t('ref.calendar.holidaysAdded', { count: resultat.crees, toConfirm: resultat.a_confirmer }));
            chargerEvenements();
        } catch (error) {
            erreur(error);
        }
    };

    // ── Semestres ─────────────────────────────────────────────────────────
    const enregistrerPeriode = async (event) => {
        event.preventDefault();
        const form = { ...periodeDialog.form, nb_semaines: Number(periodeDialog.form.nb_semaines), libelle: periodeDialog.form.libelle || null };
        try {
            if (periodeDialog.editing) await calendrierAPI.updatePeriode(periodeDialog.editing.id_periode, form);
            else await calendrierAPI.createPeriode(annee.id_annee, form);
            toast.success(t('ref.calendar.semesterSaved'));
            setPeriodeDialog({ open: false, editing: null, form: PERIODE_VIDE });
            await chargerAnnees();
        } catch (error) {
            erreur(error);
        }
    };

    // ── Événements ────────────────────────────────────────────────────────
    const ouvrirEvenement = (evenement = null) =>
        setEvenementDialog({
            open: true,
            editing: evenement,
            form: evenement
                ? {
                      ...EVENEMENT_VIDE,
                      ...evenement,
                      description: evenement.description || '',
                      id_cible: evenement.id_cible ?? '',
                      niveau: evenement.niveau || '',
                      heure_debut: hhmm(evenement.heure_debut),
                      heure_fin: hhmm(evenement.heure_fin),
                  }
                : { ...EVENEMENT_VIDE, date_debut: annee?.date_debut || '', date_fin: annee?.date_debut || '' },
        });

    const champEvenement = (nom) => (event) =>
        setEvenementDialog((d) => ({ ...d, form: { ...d.form, [nom]: event.target.value, ...(nom === 'portee' ? { id_cible: '', niveau: '' } : {}) } }));

    const enregistrerEvenement = async (event) => {
        event.preventDefault();
        const { form } = evenementDialog;
        const data = {
            titre: form.titre,
            description: form.description || null,
            date_debut: form.date_debut,
            date_fin: form.date_fin,
            type_evenement: form.type_evenement,
            bloque_affectations: form.bloque_affectations,
            portee: form.portee,
            id_cible: form.portee === 'etablissement' ? null : Number(form.id_cible) || null,
            niveau: form.portee === 'niveau' ? form.niveau : null,
            heure_debut: form.heure_debut || null,
            heure_fin: form.heure_fin || null,
        };
        try {
            if (evenementDialog.editing) await evenementAPI.update(evenementDialog.editing.id_evenement, data);
            else await evenementAPI.create(data);
            toast.success(t('ref.calendar.eventSaved'));
            setEvenementDialog({ open: false, editing: null, form: EVENEMENT_VIDE });
            chargerEvenements();
        } catch (error) {
            erreur(error);
        }
    };

    const confirmer = async (event) => {
        event.preventDefault();
        try {
            const resultat = await evenementAPI.confirmer(confirmation.evenement.id_evenement, {
                date_debut: confirmation.date_debut,
                date_fin: confirmation.date_fin,
            });
            toast[resultat.decale ? 'warning' : 'success'](resultat.decale ? t('ref.calendar.shiftedMsg') : t('ref.calendar.confirmedMsg'));
            setConfirmation({ open: false, evenement: null, date_debut: '', date_fin: '' });
            chargerEvenements();
        } catch (error) {
            erreur(error);
        }
    };

    // ── Suppressions (année, semestre, événement) ─────────────────────────
    const supprimer = async () => {
        const { type, item } = aSupprimer;
        setASupprimer(null);
        try {
            if (type === 'annee') await calendrierAPI.deleteAnnee(item.id_annee);
            if (type === 'periode') await calendrierAPI.deletePeriode(item.id_periode);
            if (type === 'evenement') await evenementAPI.delete(item.id_evenement);
            toast.success(t('ref.calendar.deleted'));
            await chargerAnnees();
            chargerEvenements();
        } catch (error) {
            erreur(error);
        }
    };

    const libelleCible = (evenement) => {
        if (evenement.portee === 'etablissement') return t('ref.scopes.etablissement');
        const source = { campus: cibles.campus, filiere: cibles.filieres, niveau: cibles.filieres, groupe: cibles.groupes }[evenement.portee] || [];
        const cle = { campus: 'id_campus', filiere: 'id_filiere', niveau: 'id_filiere', groupe: 'id_groupe' }[evenement.portee];
        const cible = source.find((c) => c[cle] === evenement.id_cible);
        const nom = cible?.nom || cible?.nom_filiere || cible?.nom_groupe || `#${evenement.id_cible}`;
        return evenement.portee === 'niveau' ? `${nom} · ${evenement.niveau}` : nom;
    };

    const evenementsAffiches = aConfirmerSeulement ? evenements.filter((e) => !e.date_confirmee) : evenements;
    const nbAConfirmer = evenements.filter((e) => !e.date_confirmee).length;

    if (loading) {
        return (
            <DashboardLayout>
                <TableSkeleton rows={8} />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {annees.length === 0 ? (
                <EmptyState
                    icon={<EventAvailable />}
                    title={t('ref.calendar.noYearTitle')}
                    description={t('ref.calendar.noYearBody')}
                    actionLabel={t('ref.calendar.newYear')}
                    onAction={() => setAnneeDialog({ open: true, editing: null, form: ANNEE_VIDE })}
                />
            ) : (
                <Stack spacing={3}>
                    {/* Année universitaire */}
                    <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <TextField
                                    select
                                    size="small"
                                    label={t('ref.calendar.year')}
                                    value={idAnnee ?? ''}
                                    onChange={(e) => setIdAnnee(Number(e.target.value))}
                                    sx={{ minWidth: 180 }}
                                >
                                    {annees.map((a) => (
                                        <MenuItem key={a.id_annee} value={a.id_annee}>
                                            {a.libelle}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                {annee?.active && <StateChip tone="success">{t('ref.calendar.active')}</StateChip>}
                                {annee && (
                                    <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                                        {plage(annee.date_debut, annee.date_fin)}
                                    </Typography>
                                )}
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {annee && (
                                    <>
                                        <IconButton
                                            size="small"
                                            onClick={() => setAnneeDialog({ open: true, editing: annee, form: { libelle: annee.libelle, date_debut: annee.date_debut, date_fin: annee.date_fin, active: annee.active } })}
                                            aria-label={t('ref.common.editItem', { name: annee.libelle })}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => setASupprimer({ type: 'annee', item: annee })} aria-label={t('ref.common.deleteItem', { name: annee.libelle })}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                        <Button variant="outlined" startIcon={<Flag />} onClick={ajouterFeries}>
                                            {t('ref.calendar.addHolidays')}
                                        </Button>
                                    </>
                                )}
                                <Button variant="contained" startIcon={<Add />} onClick={() => setAnneeDialog({ open: true, editing: null, form: ANNEE_VIDE })}>
                                    {t('ref.calendar.newYear')}
                                </Button>
                            </Stack>
                        </Box>

                        {/* Semestres */}
                        <Box sx={{ mt: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="h2" component="h2">
                                    {t('ref.calendar.semesters')}
                                </Typography>
                                <Button size="small" startIcon={<Add />} onClick={() => setPeriodeDialog({ open: true, editing: null, form: { ...PERIODE_VIDE, code: annee?.periodes?.some((p) => p.code === 'S1') ? 'S2' : 'S1' } })}>
                                    {t('ref.calendar.addSemester')}
                                </Button>
                            </Box>
                            {annee?.periodes?.length ? (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ width: 90 }}>{t('ref.calendar.cols.code')}</TableCell>
                                            <TableCell>{t('ref.calendar.cols.dates')}</TableCell>
                                            <TableCell align="right">{t('ref.calendar.cols.weeks')}</TableCell>
                                            <TableCell align="right">{t('ref.rooms.cols.actions')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {annee.periodes.map((periode) => (
                                            <TableRow key={periode.id_periode}>
                                                <TableCell sx={{ fontWeight: 600 }}>{periode.code}</TableCell>
                                                <TableCell>
                                                    {plage(periode.date_debut, periode.date_fin)}
                                                    {periode.libelle && (
                                                        <Typography component="span" variant="body2" color="text.secondary">
                                                            {' '}· {periode.libelle}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right">{periode.nb_semaines}</TableCell>
                                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setPeriodeDialog({ open: true, editing: periode, form: { code: periode.code, libelle: periode.libelle || '', date_debut: periode.date_debut, date_fin: periode.date_fin, nb_semaines: periode.nb_semaines } })}
                                                        aria-label={t('ref.common.editItem', { name: periode.code })}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => setASupprimer({ type: 'periode', item: periode })} aria-label={t('ref.common.deleteItem', { name: periode.code })}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    {t('ref.calendar.noSemester')}
                                </Typography>
                            )}
                        </Box>
                    </Paper>

                    {/* Événements */}
                    <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <Typography variant="h2" component="h2">
                                    {t('ref.calendar.events')}
                                </Typography>
                                {nbAConfirmer > 0 && <StateChip tone="warning">{t('ref.calendar.toConfirmCount', { count: nbAConfirmer })}</StateChip>}
                            </Stack>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <FormControlLabel
                                    control={<Switch size="small" checked={aConfirmerSeulement} onChange={(e) => setAConfirmerSeulement(e.target.checked)} />}
                                    label={t('ref.calendar.onlyToConfirm')}
                                />
                                <Button variant="contained" startIcon={<Add />} onClick={() => ouvrirEvenement()}>
                                    {t('ref.calendar.addEvent')}
                                </Button>
                            </Stack>
                        </Box>
                        {evenementsAffiches.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                                {t('ref.calendar.noEvents')}
                            </Typography>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>{t('ref.calendar.eventCols.dates')}</TableCell>
                                            <TableCell>{t('ref.calendar.eventCols.title')}</TableCell>
                                            <TableCell>{t('ref.calendar.eventCols.type')}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.calendar.eventCols.scope')}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.calendar.eventCols.blocking')}</TableCell>
                                            <TableCell>{t('ref.calendar.eventCols.state')}</TableCell>
                                            <TableCell align="right">{t('ref.rooms.cols.actions')}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {evenementsAffiches.map((evenement) => (
                                            <TableRow key={evenement.id_evenement} hover>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                    {plage(evenement.date_debut, evenement.date_fin)}
                                                    {evenement.heure_debut && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                            {hhmm(evenement.heure_debut)} – {hhmm(evenement.heure_fin)}
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>{evenement.titre}</TableCell>
                                                <TableCell>
                                                    <StateChip tone={toneType(evenement.type_evenement)}>{t(`ref.eventTypes.${evenement.type_evenement}`)}</StateChip>
                                                </TableCell>
                                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, whiteSpace: 'nowrap' }}>{libelleCible(evenement)}</TableCell>
                                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                    {evenement.bloque_affectations ? t('ref.calendar.blocking') : t('ref.calendar.notBlocking')}
                                                </TableCell>
                                                <TableCell>
                                                    {/* Seule la date à confirmer appelle une action : elle seule est signalée */}
                                                    {evenement.date_confirmee ? (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {t('ref.calendar.confirmed')}
                                                        </Typography>
                                                    ) : (
                                                        <StateChip tone="warning">{t('ref.calendar.toConfirm')}</StateChip>
                                                    )}
                                                </TableCell>
                                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                    {!evenement.date_confirmee && (
                                                        <Button
                                                            size="small"
                                                            onClick={() => setConfirmation({ open: true, evenement, date_debut: evenement.date_debut, date_fin: evenement.date_fin })}
                                                        >
                                                            {t('ref.calendar.confirm')}
                                                        </Button>
                                                    )}
                                                    <IconButton size="small" onClick={() => ouvrirEvenement(evenement)} aria-label={t('ref.common.editItem', { name: evenement.titre })}>
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => setASupprimer({ type: 'evenement', item: evenement })} aria-label={t('ref.common.deleteItem', { name: evenement.titre })}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Paper>
                </Stack>
            )}

            {/* Dialogue année */}
            <Dialog open={anneeDialog.open} onClose={() => setAnneeDialog({ open: false, editing: null, form: ANNEE_VIDE })} maxWidth="xs" fullWidth>
                <form onSubmit={enregistrerAnnee}>
                    <DialogTitle>{anneeDialog.editing ? t('ref.calendar.editYear') : t('ref.calendar.newYear')}</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label={t('ref.calendar.fields.label')}
                                value={anneeDialog.form.libelle}
                                onChange={(e) => setAnneeDialog((d) => ({ ...d, form: { ...d.form, libelle: e.target.value } }))}
                                helperText={t('ref.calendar.fields.labelHelp')}
                                inputProps={{ pattern: '\\d{4}-\\d{4}' }}
                                required
                                autoFocus
                            />
                            <Stack direction="row" spacing={2}>
                                <TextField fullWidth type="date" label={t('ref.calendar.fields.start')} value={anneeDialog.form.date_debut} onChange={(e) => setAnneeDialog((d) => ({ ...d, form: { ...d.form, date_debut: e.target.value } }))} InputLabelProps={{ shrink: true }} required />
                                <TextField fullWidth type="date" label={t('ref.calendar.fields.end')} value={anneeDialog.form.date_fin} onChange={(e) => setAnneeDialog((d) => ({ ...d, form: { ...d.form, date_fin: e.target.value } }))} InputLabelProps={{ shrink: true }} required />
                            </Stack>
                            <FormControlLabel
                                control={<Switch checked={anneeDialog.form.active} onChange={(e) => setAnneeDialog((d) => ({ ...d, form: { ...d.form, active: e.target.checked } }))} />}
                                label={t('ref.calendar.fields.active')}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setAnneeDialog({ open: false, editing: null, form: ANNEE_VIDE })}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained">
                            {t('common.save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Dialogue semestre */}
            <Dialog open={periodeDialog.open} onClose={() => setPeriodeDialog({ open: false, editing: null, form: PERIODE_VIDE })} maxWidth="xs" fullWidth>
                <form onSubmit={enregistrerPeriode}>
                    <DialogTitle>{periodeDialog.editing ? t('ref.calendar.editSemester') : t('ref.calendar.addSemester')}</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Stack direction="row" spacing={2}>
                                <TextField select fullWidth label={t('ref.calendar.fields.code')} value={periodeDialog.form.code} onChange={(e) => setPeriodeDialog((d) => ({ ...d, form: { ...d.form, code: e.target.value } }))}>
                                    <MenuItem value="S1">S1</MenuItem>
                                    <MenuItem value="S2">S2</MenuItem>
                                </TextField>
                                <TextField fullWidth type="number" label={t('ref.calendar.fields.weeks')} value={periodeDialog.form.nb_semaines} onChange={(e) => setPeriodeDialog((d) => ({ ...d, form: { ...d.form, nb_semaines: e.target.value } }))} inputProps={{ min: 1, max: 30 }} required />
                            </Stack>
                            <TextField label={t('ref.calendar.fields.semesterLabel')} value={periodeDialog.form.libelle} onChange={(e) => setPeriodeDialog((d) => ({ ...d, form: { ...d.form, libelle: e.target.value } }))} />
                            <Stack direction="row" spacing={2}>
                                <TextField fullWidth type="date" label={t('ref.calendar.fields.start')} value={periodeDialog.form.date_debut} onChange={(e) => setPeriodeDialog((d) => ({ ...d, form: { ...d.form, date_debut: e.target.value } }))} InputLabelProps={{ shrink: true }} required />
                                <TextField fullWidth type="date" label={t('ref.calendar.fields.end')} value={periodeDialog.form.date_fin} onChange={(e) => setPeriodeDialog((d) => ({ ...d, form: { ...d.form, date_fin: e.target.value } }))} InputLabelProps={{ shrink: true }} required />
                            </Stack>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setPeriodeDialog({ open: false, editing: null, form: PERIODE_VIDE })}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained">
                            {t('common.save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Dialogue événement */}
            <Dialog open={evenementDialog.open} onClose={() => setEvenementDialog({ open: false, editing: null, form: EVENEMENT_VIDE })} maxWidth="sm" fullWidth>
                <form onSubmit={enregistrerEvenement}>
                    <DialogTitle>{evenementDialog.editing ? t('ref.calendar.editEvent') : t('ref.calendar.addEvent')}</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField label={t('ref.calendar.fields.title')} value={evenementDialog.form.titre} onChange={champEvenement('titre')} required autoFocus />
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField select fullWidth label={t('ref.calendar.fields.type')} value={evenementDialog.form.type_evenement} onChange={champEvenement('type_evenement')}>
                                    {TYPES_EVENEMENT.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {t(`ref.eventTypes.${type}`)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField fullWidth type="date" label={t('ref.calendar.fields.start')} value={evenementDialog.form.date_debut} onChange={champEvenement('date_debut')} InputLabelProps={{ shrink: true }} required />
                                <TextField fullWidth type="date" label={t('ref.calendar.fields.end')} value={evenementDialog.form.date_fin} onChange={champEvenement('date_fin')} InputLabelProps={{ shrink: true }} required />
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField select fullWidth label={t('ref.calendar.fields.scope')} value={evenementDialog.form.portee} onChange={champEvenement('portee')}>
                                    {PORTEES.map((portee) => (
                                        <MenuItem key={portee} value={portee}>
                                            {t(`ref.scopes.${portee}`)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                {evenementDialog.form.portee === 'campus' && (
                                    <TextField select fullWidth label={t('ref.calendar.fields.campus')} value={evenementDialog.form.id_cible} onChange={champEvenement('id_cible')} required>
                                        {cibles.campus.map((c) => (
                                            <MenuItem key={c.id_campus} value={c.id_campus}>
                                                {c.nom}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                                {['filiere', 'niveau'].includes(evenementDialog.form.portee) && (
                                    <TextField select fullWidth label={t('ref.calendar.fields.program')} value={evenementDialog.form.id_cible} onChange={champEvenement('id_cible')} required>
                                        {cibles.filieres.map((f) => (
                                            <MenuItem key={f.id_filiere} value={f.id_filiere}>
                                                {f.nom_filiere}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                                {evenementDialog.form.portee === 'niveau' && (
                                    <TextField fullWidth label={t('ref.calendar.fields.level')} value={evenementDialog.form.niveau} onChange={champEvenement('niveau')} placeholder="3ème année" required />
                                )}
                                {evenementDialog.form.portee === 'groupe' && (
                                    <TextField select fullWidth label={t('ref.calendar.fields.group')} value={evenementDialog.form.id_cible} onChange={champEvenement('id_cible')} required>
                                        {cibles.groupes.map((g) => (
                                            <MenuItem key={g.id_groupe} value={g.id_groupe}>
                                                {g.nom_groupe}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField fullWidth type="time" label={t('ref.calendar.fields.timeStart')} value={evenementDialog.form.heure_debut} onChange={champEvenement('heure_debut')} InputLabelProps={{ shrink: true }} helperText={t('ref.calendar.fields.timeHelp')} />
                                <TextField fullWidth type="time" label={t('ref.calendar.fields.timeEnd')} value={evenementDialog.form.heure_fin} onChange={champEvenement('heure_fin')} InputLabelProps={{ shrink: true }} />
                            </Stack>
                            <TextField label={t('ref.calendar.fields.description')} value={evenementDialog.form.description} onChange={champEvenement('description')} multiline minRows={2} />
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={evenementDialog.form.bloque_affectations}
                                        onChange={(e) => setEvenementDialog((d) => ({ ...d, form: { ...d.form, bloque_affectations: e.target.checked } }))}
                                    />
                                }
                                label={t('ref.calendar.fields.blocking')}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEvenementDialog({ open: false, editing: null, form: EVENEMENT_VIDE })}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained">
                            {t('common.save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Confirmation d'une fête lunaire */}
            <Dialog open={confirmation.open} onClose={() => setConfirmation({ open: false, evenement: null, date_debut: '', date_fin: '' })} maxWidth="xs" fullWidth>
                <form onSubmit={confirmer}>
                    <DialogTitle>{t('ref.calendar.confirmTitle', { name: confirmation.evenement?.titre })}</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {t('ref.calendar.confirmIntro')}
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <TextField fullWidth type="date" label={t('ref.calendar.fields.start')} value={confirmation.date_debut} onChange={(e) => setConfirmation((c) => ({ ...c, date_debut: e.target.value }))} InputLabelProps={{ shrink: true }} required />
                            <TextField fullWidth type="date" label={t('ref.calendar.fields.end')} value={confirmation.date_fin} onChange={(e) => setConfirmation((c) => ({ ...c, date_fin: e.target.value }))} InputLabelProps={{ shrink: true }} required />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setConfirmation({ open: false, evenement: null, date_debut: '', date_fin: '' })}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained">
                            {t('ref.calendar.confirm')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <ConfirmDialog
                open={Boolean(aSupprimer)}
                title={t('ref.calendar.deleteTitle')}
                message={
                    aSupprimer?.type === 'annee'
                        ? t('ref.calendar.deleteYearBody', { name: aSupprimer.item.libelle })
                        : t('ref.calendar.deleteBody', { name: aSupprimer?.item?.titre || aSupprimer?.item?.code })
                }
                onConfirm={supprimer}
                onCancel={() => setASupprimer(null)}
            />
        </DashboardLayout>
    );
}
