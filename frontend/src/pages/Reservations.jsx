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
    MenuItem,
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
import { Add, AutoAwesome } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import ViolationsDialog from '../components/planning/ViolationsDialog';
import AssistantCreneauxDialog from '../components/planning/AssistantCreneauxDialog';
import EmptyState from '../design-system/components/EmptyState';
import StateChip from '../design-system/components/StateChip';
import { TableSkeleton } from '../design-system/components/PremiumSkeleton';
import { affectationAPI, enseignantAPI, groupeAPI, imprevuAPI, reservationAPI, salleAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchAll } from '../utils/fetchAll';
import { ds } from '../design-system/tokens';

const TYPES = ['soutenance', 'reunion', 'rattrapage', 'evenement', 'club', 'examen'];
const STATUTS = ['demandee', 'validee', 'refusee', 'annulee'];
// Seules les exceptions portent une pastille : à valider (attente), refusée, annulée
const TON_STATUT = { demandee: 'warning', refusee: 'neutral', annulee: 'neutral' };
const VIDE = { type: 'soutenance', titre: '', description: '', date: '', heure_debut: '09:00', heure_fin: '10:30', id_salle: '', id_affectation_origine: '', personnes: [], groupes: [] };
const hhmm = (h) => String(h || '').slice(0, 5);
const minutes = (h) => {
    const [a, b] = hhmm(h).split(':').map(Number);
    return a * 60 + (b || 0);
};

/**
 * Réservations de salles hors cours (phase P5) : les enseignants demandent (soutenance,
 * réunion, rattrapage, événement, club), l'administration valide ou refuse. Mêmes règles que
 * les séances : un conflit est refusé en 409, l'administration peut forcer en justifiant.
 */
export default function Reservations() {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const { user } = useAuth();
    const admin = user?.role === 'admin';
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statut, setStatut] = useState(admin ? 'demandee' : 'tous');
    const [ref, setRef] = useState({ salles: [], enseignants: [], groupes: [], seances: [] });
    const [form, setForm] = useState(null);
    const [violations, setViolations] = useState(null);
    const [refus, setRefus] = useState(null);
    const [assistant, setAssistant] = useState(false);

    const formatDate = useMemo(() => new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }), [i18n.language]);

    const charger = useCallback(async () => {
        try {
            setReservations(await reservationAPI.getAll(statut === 'tous' ? {} : { statut }));
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setLoading(false);
        }
    }, [statut, t, toast]);

    useEffect(() => {
        charger();
    }, [charger]);

    useEffect(() => {
        Promise.all([
            fetchAll(salleAPI.getAll),
            fetchAll(enseignantAPI.getAll),
            fetchAll(groupeAPI.getAll),
            user?.role === 'enseignant' ? affectationAPI.getByEnseignant(user.id_user, { limit: 100 }).then((r) => r.data ?? r) : Promise.resolve([]),
        ])
            .then(([salles, enseignants, groupes, seances]) => setRef({ salles, enseignants, groupes, seances }))
            .catch(() => {});
    }, [user?.role, user?.id_user]);

    const erreur = (error) => toast.error(error.response?.data?.error || error.response?.data?.errors?.[0]?.message || error.message);
    const champ = (nom) => (e) => setForm((f) => ({ ...f, [nom]: e.target.value }));

    const corps = (f, extra = {}) => ({
        type: f.type,
        titre: f.titre.trim(),
        description: f.description.trim() || null,
        date: f.date,
        heure_debut: f.heure_debut,
        heure_fin: f.heure_fin,
        id_salle: f.id_salle || null,
        ...(f.type === 'rattrapage' && f.id_affectation_origine ? { id_affectation_origine: Number(f.id_affectation_origine) } : {}),
        participants: [
            ...f.personnes.map((e) => ({ id_user: e.id_user, role: f.type === 'soutenance' ? 'jury' : 'participant' })),
            ...f.groupes.map((g) => ({ id_groupe: g.id_groupe, role: 'etudiant' })),
        ],
        ...extra,
    });

    const enregistrer = async (extra = {}) => {
        try {
            const reponse = await reservationAPI.create(corps(form, extra));
            toast.success(reponse.reservation.statut === 'validee' ? t('resa.saved') : t('resa.requested'));
            setForm(null);
            setViolations(null);
            charger();
        } catch (error) {
            if (error.status === 409 && error.response?.data?.violations) {
                setViolations({ liste: error.response.data.violations, forcer: admin ? (justification) => enregistrer({ forcer: true, justification }) : null });
                return;
            }
            erreur(error);
        }
    };

    const valider = async (r, extra = {}) => {
        try {
            await reservationAPI.valider(r.id_reservation, extra);
            toast.success(t('resa.validated'));
            setViolations(null);
            charger();
        } catch (error) {
            if (error.status === 409 && error.response?.data?.violations) {
                setViolations({ liste: error.response.data.violations, forcer: (justification) => valider(r, { forcer: true, justification }) });
                return;
            }
            erreur(error);
        }
    };

    const refuser = async () => {
        try {
            await reservationAPI.refuser(refus.reservation.id_reservation, refus.motif.trim());
            toast.success(t('resa.refused'));
            setRefus(null);
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    const annuler = async (r) => {
        try {
            await reservationAPI.annuler(r.id_reservation);
            toast.success(t('resa.cancelled'));
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    const nom = (u) => (u ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() : '');
    const duree = form ? Math.max(15, minutes(form.heure_fin) - minutes(form.heure_debut)) : 60;

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <TextField select size="small" label={t('resa.status')} value={statut} onChange={(e) => setStatut(e.target.value)} sx={{ minWidth: 200 }}>
                        <MenuItem value="tous">{t('resa.allStatuses')}</MenuItem>
                        {STATUTS.map((s) => (
                            <MenuItem key={s} value={s}>
                                {t(`resa.statuses.${s}`)}
                            </MenuItem>
                        ))}
                    </TextField>
                    <Button variant="contained" startIcon={<Add />} onClick={() => setForm({ ...VIDE })}>
                        {t('resa.add')}
                    </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 820 }}>
                    {admin ? t('resa.introAdmin') : t('resa.intro')}
                </Typography>

                {loading ? (
                    <TableSkeleton rows={6} />
                ) : reservations.length === 0 ? (
                    <EmptyState title={t('resa.emptyTitle')} description={t('resa.emptyBody')} actionLabel={t('resa.add')} onAction={() => setForm({ ...VIDE })} />
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('resa.cols.when')}</TableCell>
                                    <TableCell>{t('resa.cols.what')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('resa.cols.room')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('resa.cols.participants')}</TableCell>
                                    <TableCell align="right">{t('ref.rooms.cols.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {reservations.map((r) => {
                                    const proprietaire = r.id_demandeur === user?.id_user;
                                    return (
                                        <TableRow key={r.id_reservation} hover>
                                            <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                                    {formatDate.format(new Date(`${r.date}T12:00:00`))}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: ds.font.board, fontVariantNumeric: 'tabular-nums' }}>
                                                    {hhmm(r.heure_debut)}–{hhmm(r.heure_fin)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {r.titre}
                                                    </Typography>
                                                    {TON_STATUT[r.statut] && <StateChip tone={TON_STATUT[r.statut]}>{t(`resa.statuses.${r.statut}`)}</StateChip>}
                                                    {r.force && <StateChip tone="warning">{t('resa.forced')}</StateChip>}
                                                </Stack>
                                                <Typography variant="caption" color="text.secondary">
                                                    {t(`resa.types.${r.type}`)}
                                                    {admin && r.demandeur ? ` · ${nom(r.demandeur)}` : ''}
                                                    {r.statut === 'refusee' && r.motif_refus ? ` · ${r.motif_refus}` : ''}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{r.salle?.nom_salle ?? t('assistant.remote')}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                <Typography variant="body2">
                                                    {[...r.participants.filter((p) => p.user).map((p) => nom(p.user)), ...r.participants.filter((p) => p.groupe).map((p) => p.groupe.nom_groupe)].join(', ') || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                {admin && r.statut === 'demandee' && (
                                                    <>
                                                        <Button size="small" onClick={() => setRefus({ reservation: r, motif: '' })}>
                                                            {t('resa.refuse')}
                                                        </Button>
                                                        <Button size="small" variant="contained" onClick={() => valider(r)}>
                                                            {t('resa.validate')}
                                                        </Button>
                                                    </>
                                                )}
                                                {(admin || proprietaire) && ['demandee', 'validee'].includes(r.statut) && (
                                                    <Button size="small" color="error" onClick={() => annuler(r)}>
                                                        {t('resa.cancel')}
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Dialog open={Boolean(form)} onClose={() => setForm(null)} maxWidth="sm" fullWidth>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        enregistrer();
                    }}
                >
                    <DialogTitle>{t('resa.add')}</DialogTitle>
                    <DialogContent>
                        {form && (
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField select label={t('resa.fields.type')} value={form.type} onChange={champ('type')} sx={{ minWidth: 180 }}>
                                        {TYPES.filter((type) => admin || type !== 'examen').map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {t(`resa.types.${type}`)}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField label={t('resa.fields.title')} value={form.titre} onChange={champ('titre')} required fullWidth />
                                </Stack>
                                {form.type === 'rattrapage' && (
                                    <TextField select label={t('resa.fields.origin')} value={form.id_affectation_origine} onChange={champ('id_affectation_origine')} required>
                                        {ref.seances.map((s) => (
                                            <MenuItem key={s.id_affectation} value={s.id_affectation}>
                                                {s.date_seance} · {s.cours?.nom_cours} · {s.groupe?.nom_groupe}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                                <Autocomplete
                                    multiple
                                    options={ref.enseignants.filter((e) => e.user)}
                                    value={form.personnes}
                                    onChange={(_, v) => setForm((f) => ({ ...f, personnes: v }))}
                                    getOptionLabel={(e) => `${e.user.nom} ${e.user.prenom}`}
                                    isOptionEqualToValue={(a, b) => a.id_user === b.id_user}
                                    renderInput={(params) => <TextField {...params} label={form.type === 'soutenance' ? t('resa.fields.jury') : t('resa.fields.people')} />}
                                />
                                <Autocomplete
                                    multiple
                                    options={ref.groupes}
                                    value={form.groupes}
                                    onChange={(_, v) => setForm((f) => ({ ...f, groupes: v }))}
                                    getOptionLabel={(g) => g.nom_groupe}
                                    isOptionEqualToValue={(a, b) => a.id_groupe === b.id_groupe}
                                    renderInput={(params) => <TextField {...params} label={t('resa.fields.groups')} />}
                                />
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField type="date" label={t('resa.fields.date')} value={form.date} onChange={champ('date')} InputLabelProps={{ shrink: true }} required fullWidth />
                                    <TextField type="time" label={t('resa.fields.start')} value={form.heure_debut} onChange={champ('heure_debut')} InputLabelProps={{ shrink: true }} required sx={{ minWidth: 130 }} />
                                    <TextField type="time" label={t('resa.fields.end')} value={form.heure_fin} onChange={champ('heure_fin')} InputLabelProps={{ shrink: true }} required sx={{ minWidth: 130 }} />
                                </Stack>
                                <TextField select label={t('resa.fields.room')} value={form.id_salle} onChange={champ('id_salle')} SelectProps={{ displayEmpty: true }} InputLabelProps={{ shrink: true }} helperText={form.type === 'reunion' ? t('resa.fields.roomOptional') : null}>
                                    <MenuItem value="">{t('assistant.remote')}</MenuItem>
                                    {ref.salles.map((s) => (
                                        <MenuItem key={s.id_salle} value={s.id_salle}>
                                            {s.nom_salle} · {s.type_salle} · {s.capacite} {t('resa.places')}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <Box>
                                    <Button startIcon={<AutoAwesome />} onClick={() => setAssistant(true)}>
                                        {t('resa.findSlot')}
                                    </Button>
                                </Box>
                                <TextField label={t('resa.fields.description')} value={form.description} onChange={champ('description')} multiline minRows={2} />
                            </Stack>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setForm(null)}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained">
                            {admin ? t('resa.book') : t('resa.request')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <AssistantCreneauxDialog
                open={assistant}
                titre={t('resa.findSlot')}
                sousTitre={t('resa.findSlotHelp', { minutes: duree })}
                onClose={() => setAssistant(false)}
                chercher={(date_debut, date_fin) =>
                    imprevuAPI.creneauxReservation({ type: form?.type, duree_minutes: duree, date_debut, date_fin, id_salle: form?.id_salle || null, participants: corps(form).participants })
                }
                onChoisir={(p) => {
                    setForm((f) => ({ ...f, date: p.date, heure_debut: p.heure_debut, heure_fin: p.heure_fin, id_salle: p.id_salle ?? f.id_salle }));
                    setAssistant(false);
                }}
            />

            <Dialog open={Boolean(refus)} onClose={() => setRefus(null)} maxWidth="xs" fullWidth>
                <DialogTitle>{t('resa.refuseTitle')}</DialogTitle>
                <DialogContent>
                    <TextField label={t('resa.reason')} value={refus?.motif ?? ''} onChange={(e) => setRefus((r) => ({ ...r, motif: e.target.value }))} multiline minRows={2} fullWidth autoFocus sx={{ mt: 1 }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRefus(null)}>{t('common.cancel')}</Button>
                    <Button variant="contained" onClick={refuser} disabled={!refus?.motif.trim()}>
                        {t('resa.refuse')}
                    </Button>
                </DialogActions>
            </Dialog>

            <ViolationsDialog violations={violations?.liste} onClose={() => setViolations(null)} onForcer={violations?.forcer} />
        </DashboardLayout>
    );
}
