import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    ListSubheader,
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
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../design-system/components/EmptyState';
import StateChip from '../design-system/components/StateChip';
import { TableSkeleton } from '../design-system/components/PremiumSkeleton';
import { calendrierAPI, creneauAPI, disponibiliteAPI, imprevuAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchAll } from '../utils/fetchAll';

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const VOEUX = ['neutre', 'prefere', 'eviter'];
// Pastilles : l'indisponibilité et le vœu « à éviter » sont les exceptions à signaler
const TON_VOEU = { prefere: 'info', eviter: 'warning' };
const hhmm = (heure) => String(heure || '').slice(0, 5);
const aujourdhui = () => new Date().toISOString().slice(0, 10);

/**
 * Mes disponibilités : un vacataire n'est placé que sur les créneaux qu'il déclare disponibles
 * (opt-in), un permanent partout sauf sur ses indisponibilités (opt-out). Les vœux guident la
 * planification sans la bloquer.
 */
export default function Disponibilites() {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const { user } = useAuth();
    const [declarations, setDeclarations] = useState([]);
    const [creneaux, setCreneaux] = useState([]);
    const [periode, setPeriode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState(null);
    const [aSupprimer, setASupprimer] = useState(null);
    const [absence, setAbsence] = useState(null);

    const date = useMemo(() => new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }), [i18n.language]);
    const vacataire = user?.statut === 'vacataire';

    const charger = useCallback(async () => {
        if (!user?.id_user) return;
        try {
            setDeclarations(await disponibiliteAPI.getByEnseignant(user.id_user));
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setLoading(false);
        }
    }, [user?.id_user, t, toast]);

    useEffect(() => {
        charger();
        Promise.all([fetchAll(creneauAPI.getAll), calendrierAPI.getAnnees()])
            .then(([liste, annees]) => {
                setCreneaux(liste.filter((c) => (c.variante ?? 'normale') === 'normale'));
                // Validité proposée par défaut : la période en cours (ou la prochaine) de l'année active
                const periodes = annees.filter((a) => a.active).flatMap((a) => a.periodes);
                setPeriode(periodes.find((p) => p.date_fin >= aujourdhui()) ?? null);
            })
            .catch(() => {});
    }, [charger]);

    const creneauxParJour = useMemo(
        () =>
            JOURS.map((jour) => ({
                jour,
                liste: creneaux.filter((c) => c.jour_semaine === jour).sort((a, b) => a.heure_debut.localeCompare(b.heure_debut)),
            })).filter((g) => g.liste.length > 0),
        [creneaux]
    );

    const libelleCreneau = (c) => (c ? `${t(`ref.days.${c.jour_semaine}`)} ${hhmm(c.heure_debut)}–${hhmm(c.heure_fin)}` : '—');

    const triees = useMemo(
        () =>
            [...declarations].sort(
                (a, b) =>
                    JOURS.indexOf(a.creneau?.jour_semaine) - JOURS.indexOf(b.creneau?.jour_semaine) ||
                    String(a.creneau?.heure_debut).localeCompare(String(b.creneau?.heure_debut)) ||
                    String(a.date_debut).localeCompare(String(b.date_debut))
            ),
        [declarations]
    );

    const ouvrir = () =>
        setForm({
            id_creneau: '',
            date_debut: periode?.date_debut ?? '',
            date_fin: periode?.date_fin ?? '',
            disponible: vacataire,
            preference: 'neutre',
            raison_indisponibilite: '',
        });

    const champ = (nom) => (e) => setForm((f) => ({ ...f, [nom]: e.target.value }));

    const enregistrer = async (event) => {
        event.preventDefault();
        try {
            await disponibiliteAPI.create({
                id_creneau: Number(form.id_creneau),
                date_debut: form.date_debut,
                date_fin: form.date_fin,
                disponible: form.disponible,
                preference: form.disponible ? form.preference : 'neutre',
                raison_indisponibilite: form.disponible ? null : form.raison_indisponibilite.trim() || null,
            });
            toast.success(t('ref.availability.created'));
            setForm(null);
            charger();
        } catch (error) {
            toast.error(error.response?.data?.error || error.response?.data?.message || error.message);
        }
    };

    const supprimer = async () => {
        const declaration = aSupprimer;
        setASupprimer(null);
        try {
            await disponibiliteAPI.delete(declaration.id_disponibilite);
            toast.success(t('ref.availability.deleted'));
            charger();
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        }
    };

    // Absence (maladie, déplacement) : bloque tous les créneaux de la période ; l'administration est prévenue
    const declarerAbsence = async (event) => {
        event.preventDefault();
        try {
            const reponse = await imprevuAPI.declarerAbsence({ date_debut: absence.date_debut, date_fin: absence.date_fin, motif: absence.motif.trim() });
            toast.success(t('incidents.absenceSaved', { count: reponse.seances.length }));
            setAbsence(null);
            charger();
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        }
    };

    const intro = user?.statut === 'vacataire' ? 'introVacataire' : user?.statut === 'permanent' ? 'introPermanent' : 'introUnknown';

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 720 }}>
                        {t(`ref.availability.${intro}`)}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" onClick={() => setAbsence({ date_debut: aujourdhui(), date_fin: aujourdhui(), motif: '' })}>
                            {t('incidents.declareAbsence')}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={ouvrir}>
                            {t('ref.availability.add')}
                        </Button>
                    </Stack>
                </Box>

                {loading ? (
                    <TableSkeleton rows={5} />
                ) : triees.length === 0 ? (
                    <EmptyState
                        title={t('ref.availability.emptyTitle')}
                        description={t(vacataire ? 'ref.availability.emptyVacataire' : 'ref.availability.emptyPermanent')}
                        actionLabel={t('ref.availability.add')}
                        onAction={ouvrir}
                    />
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('ref.availability.cols.slot')}</TableCell>
                                    <TableCell>{t('ref.availability.cols.period')}</TableCell>
                                    <TableCell>{t('ref.availability.cols.kind')}</TableCell>
                                    <TableCell>{t('ref.availability.cols.wish')}</TableCell>
                                    <TableCell align="right">{t('ref.rooms.cols.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {triees.map((d) => (
                                    <TableRow key={d.id_disponibilite} hover>
                                        <TableCell sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{libelleCreneau(d.creneau)}</TableCell>
                                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                            {d.date_debut === d.date_fin
                                                ? date.format(new Date(`${d.date_debut}T00:00:00`))
                                                : `${date.format(new Date(`${d.date_debut}T00:00:00`))} → ${date.format(new Date(`${d.date_fin}T00:00:00`))}`}
                                        </TableCell>
                                        <TableCell>
                                            {d.disponible ? (
                                                <Typography variant="body2">{t('ref.availability.kinds.disponible')}</Typography>
                                            ) : (
                                                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                                    <StateChip tone="danger">{t('ref.availability.kinds.indisponible')}</StateChip>
                                                    {d.raison_indisponibilite && (
                                                        <Typography variant="caption" color="text.secondary">
                                                            {d.raison_indisponibilite}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            )}
                                        </TableCell>
                                        <TableCell>{TON_VOEU[d.preference] && <StateChip tone={TON_VOEU[d.preference]}>{t(`ref.availability.wishes.${d.preference}`)}</StateChip>}</TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" color="error" onClick={() => setASupprimer(d)} aria-label={t('ref.common.deleteItem', { name: libelleCreneau(d.creneau) })}>
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

            <Dialog open={Boolean(form)} onClose={() => setForm(null)} maxWidth="xs" fullWidth>
                <form onSubmit={enregistrer}>
                    <DialogTitle>{t('ref.availability.add')}</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField select label={t('ref.availability.fields.slot')} value={form?.id_creneau ?? ''} onChange={champ('id_creneau')} required>
                                {creneauxParJour.flatMap(({ jour, liste }) => [
                                    <ListSubheader key={`h-${jour}`}>{t(`ref.days.${jour}`)}</ListSubheader>,
                                    ...liste.map((c) => (
                                        <MenuItem key={c.id_creneau} value={c.id_creneau}>
                                            {libelleCreneau(c)}
                                        </MenuItem>
                                    )),
                                ])}
                            </TextField>
                            <Stack direction="row" spacing={2}>
                                <TextField type="date" label={t('ref.availability.fields.from')} value={form?.date_debut ?? ''} onChange={champ('date_debut')} InputLabelProps={{ shrink: true }} required fullWidth />
                                <TextField type="date" label={t('ref.availability.fields.to')} value={form?.date_fin ?? ''} onChange={champ('date_fin')} InputLabelProps={{ shrink: true }} inputProps={{ min: form?.date_debut }} required fullWidth />
                            </Stack>
                            <Box>
                                <Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                                    {t('ref.availability.fields.kind')}
                                </Typography>
                                <ToggleButtonGroup exclusive size="small" value={form?.disponible ? 'oui' : 'non'} onChange={(_, v) => v && setForm((f) => ({ ...f, disponible: v === 'oui' }))} fullWidth>
                                    <ToggleButton value="oui">{t('ref.availability.kinds.disponible')}</ToggleButton>
                                    <ToggleButton value="non">{t('ref.availability.kinds.indisponible')}</ToggleButton>
                                </ToggleButtonGroup>
                            </Box>
                            {form?.disponible ? (
                                <TextField select label={t('ref.availability.fields.wish')} value={form.preference} onChange={champ('preference')}>
                                    {VOEUX.map((v) => (
                                        <MenuItem key={v} value={v}>
                                            {t(`ref.availability.wishes.${v}`)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            ) : (
                                <TextField label={t('ref.availability.fields.reason')} helperText={t('ref.availability.fields.reasonHelp')} value={form?.raison_indisponibilite ?? ''} onChange={champ('raison_indisponibilite')} />
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setForm(null)}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained">
                            {t('common.save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog open={Boolean(absence)} onClose={() => setAbsence(null)} maxWidth="xs" fullWidth>
                <form onSubmit={declarerAbsence}>
                    <DialogTitle>{t('incidents.declareAbsence')}</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {t('incidents.absenceSelfIntro')}
                        </Typography>
                        <Stack spacing={2}>
                            <Stack direction="row" spacing={2}>
                                <TextField type="date" label={t('ref.availability.fields.from')} value={absence?.date_debut ?? ''} onChange={(e) => setAbsence((a) => ({ ...a, date_debut: e.target.value }))} InputLabelProps={{ shrink: true }} required fullWidth />
                                <TextField type="date" label={t('ref.availability.fields.to')} value={absence?.date_fin ?? ''} onChange={(e) => setAbsence((a) => ({ ...a, date_fin: e.target.value }))} InputLabelProps={{ shrink: true }} inputProps={{ min: absence?.date_debut }} required fullWidth />
                            </Stack>
                            <TextField label={t('incidents.reason')} value={absence?.motif ?? ''} onChange={(e) => setAbsence((a) => ({ ...a, motif: e.target.value }))} required />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setAbsence(null)}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained" disabled={!absence?.motif.trim()}>
                            {t('incidents.declare')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <ConfirmDialog
                open={Boolean(aSupprimer)}
                title={t('ref.availability.deleteTitle')}
                message={t('ref.availability.deleteBody', { slot: libelleCreneau(aSupprimer?.creneau) })}
                onConfirm={supprimer}
                onCancel={() => setASupprimer(null)}
            />
        </DashboardLayout>
    );
}
