import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    ButtonBase,
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
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../design-system/components/EmptyState';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { creneauAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { ds } from '../../design-system/tokens';
import { formatHeure } from '../../utils/session';

const JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const REGIMES = ['initiale', 'continue', 'executive'];
const VARIANTES = ['normale', 'ramadan'];

const enMinutes = (heure) => {
    const [h, m] = String(heure).split(':').map(Number);
    return h * 60 + m;
};

/**
 * Grilles horaires : une par régime (initiale, continue, executive) et par variante
 * (normale, ramadan). Une séance est placée sur (jour, rang) ; la variante ramadan
 * reprend les mêmes rangs à horaires réduits.
 */
export default function Creneaux() {
    const { t } = useTranslation();
    const toast = useToast();
    const [regime, setRegime] = useState('initiale');
    const [variante, setVariante] = useState('normale');
    const [creneaux, setCreneaux] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialog, setDialog] = useState({ open: false, editing: null });
    const [form, setForm] = useState({ jour_semaine: 'lundi', heure_debut: '', heure_fin: '' });
    const [aSupprimer, setASupprimer] = useState(null);

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            const reponse = await creneauAPI.getAll({ regime, variante, limit: 100 });
            setCreneaux(reponse.data || []);
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setLoading(false);
        }
    }, [regime, variante, t, toast]);

    useEffect(() => {
        charger();
    }, [charger]);

    // Jours affichés : lundi → samedi, plus le dimanche s'il porte des créneaux
    const jours = useMemo(
        () => JOURS.filter((jour) => jour !== 'dimanche' || creneaux.some((c) => c.jour_semaine === 'dimanche')),
        [creneaux]
    );
    const rangMax = useMemo(() => Math.max(0, ...creneaux.map((c) => c.rang || 0)), [creneaux]);
    const cellule = useMemo(() => {
        const index = new Map(creneaux.map((c) => [`${c.jour_semaine}-${c.rang}`, c]));
        return (jour, rang) => index.get(`${jour}-${rang}`);
    }, [creneaux]);

    const chevauchePrecedent = (creneau) => {
        const precedent = cellule(creneau.jour_semaine, creneau.rang - 1);
        return precedent && enMinutes(creneau.heure_debut) < enMinutes(precedent.heure_fin);
    };

    const ouvrir = (creneau = null, jour = 'lundi') => {
        setForm(
            creneau
                ? { jour_semaine: creneau.jour_semaine, heure_debut: formatHeure(creneau.heure_debut), heure_fin: formatHeure(creneau.heure_fin) }
                : { jour_semaine: jour, heure_debut: '', heure_fin: '' }
        );
        setDialog({ open: true, editing: creneau });
    };

    const enregistrer = async (event) => {
        event.preventDefault();
        if (!form.heure_debut || !form.heure_fin || enMinutes(form.heure_fin) <= enMinutes(form.heure_debut)) {
            toast.error(t('ref.grids.endAfterStart'));
            return;
        }
        try {
            if (dialog.editing) {
                await creneauAPI.update(dialog.editing.id_creneau, form);
                toast.success(t('ref.grids.updated'));
            } else {
                await creneauAPI.create({ ...form, regime, variante });
                toast.success(t('ref.grids.created'));
            }
            setDialog({ open: false, editing: null });
            charger();
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        }
    };

    const supprimer = async () => {
        const creneau = aSupprimer;
        setASupprimer(null);
        setDialog({ open: false, editing: null });
        try {
            await creneauAPI.delete(creneau.id_creneau);
            toast.success(t('ref.grids.deleted'));
            charger();
        } catch (error) {
            toast.error(error.status === 409 ? t('ref.grids.inUse') : error.response?.data?.error || error.message);
        }
    };

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <ToggleButtonGroup size="small" exclusive value={regime} onChange={(_, v) => v && setRegime(v)} aria-label={t('ref.grids.regimeLabel')}>
                            {REGIMES.map((r) => (
                                <ToggleButton key={r} value={r}>
                                    {t(`ref.regimes.${r}`)}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                        <ToggleButtonGroup size="small" exclusive value={variante} onChange={(_, v) => v && setVariante(v)} aria-label={t('ref.grids.variantLabel')}>
                            {VARIANTES.map((v) => (
                                <ToggleButton key={v} value={v}>
                                    {t(`ref.grids.variants.${v}`)}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    </Stack>
                    <Button variant="contained" startIcon={<Add />} onClick={() => ouvrir()}>
                        {t('ref.grids.addSlot')}
                    </Button>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 760 }}>
                    {t('ref.grids.intro')}
                </Typography>

                {loading ? (
                    <TableSkeleton rows={5} />
                ) : creneaux.length === 0 ? (
                    <EmptyState
                        title={t('ref.grids.emptyTitle')}
                        description={t('ref.grids.emptyBody')}
                        actionLabel={t('ref.grids.addSlot')}
                        onAction={() => ouvrir()}
                    />
                ) : (
                    <TableContainer>
                        <Table size="small" sx={{ tableLayout: 'fixed', minWidth: 720 }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 64 }}>{t('ref.grids.rank')}</TableCell>
                                    {jours.map((jour) => (
                                        <TableCell key={jour}>{t(`ref.days.${jour}`)}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Array.from({ length: rangMax }, (_, i) => i + 1).map((rang) => (
                                    <TableRow key={rang}>
                                        <TableCell sx={{ fontFamily: ds.font.board, fontWeight: 600, color: 'text.secondary' }}>{rang}</TableCell>
                                        {jours.map((jour) => {
                                            const creneau = cellule(jour, rang);
                                            if (!creneau) {
                                                return (
                                                    <TableCell key={jour} sx={{ color: 'text.disabled' }}>
                                                        —
                                                    </TableCell>
                                                );
                                            }
                                            return (
                                                <TableCell key={jour} sx={{ p: 0.5 }}>
                                                    <ButtonBase
                                                        onClick={() => ouvrir(creneau)}
                                                        aria-label={t('ref.grids.editSlot', {
                                                            day: t(`ref.days.${jour}`),
                                                            start: formatHeure(creneau.heure_debut),
                                                            end: formatHeure(creneau.heure_fin),
                                                        })}
                                                        sx={{
                                                            width: '100%',
                                                            justifyContent: 'flex-start',
                                                            flexDirection: 'column',
                                                            alignItems: 'flex-start',
                                                            gap: 0.5,
                                                            px: 1,
                                                            py: 0.75,
                                                            borderRadius: `${ds.radius.sm}px`,
                                                            border: '1px solid',
                                                            borderColor: 'divider',
                                                            '&:hover': { bgcolor: 'action.hover' },
                                                        }}
                                                    >
                                                        <Typography component="span" sx={{ fontFamily: ds.font.board, fontWeight: 600, fontSize: '1rem', letterSpacing: '0.02em' }}>
                                                            {formatHeure(creneau.heure_debut)} – {formatHeure(creneau.heure_fin)}
                                                        </Typography>
                                                        <Typography component="span" variant="caption" color="text.secondary">
                                                            {t('ref.grids.minutes', { n: creneau.duree_minutes })}
                                                        </Typography>
                                                        {chevauchePrecedent(creneau) && <StateChip tone="warning">{t('ref.grids.overlap')}</StateChip>}
                                                    </ButtonBase>
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Dialog open={dialog.open} onClose={() => setDialog({ open: false, editing: null })} maxWidth="xs" fullWidth>
                <form onSubmit={enregistrer}>
                    <DialogTitle>{dialog.editing ? t('ref.grids.dialogEdit') : t('ref.grids.dialogCreate')}</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {t(`ref.regimes.${regime}`)} · {t(`ref.grids.variants.${variante}`)}
                        </Typography>
                        <Stack spacing={2}>
                            <TextField select label={t('ref.grids.fields.day')} value={form.jour_semaine} onChange={(e) => setForm((f) => ({ ...f, jour_semaine: e.target.value }))}>
                                {JOURS.map((jour) => (
                                    <MenuItem key={jour} value={jour}>
                                        {t(`ref.days.${jour}`)}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    fullWidth
                                    type="time"
                                    label={t('ref.grids.fields.start')}
                                    value={form.heure_debut}
                                    onChange={(e) => setForm((f) => ({ ...f, heure_debut: e.target.value }))}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    type="time"
                                    label={t('ref.grids.fields.end')}
                                    value={form.heure_fin}
                                    onChange={(e) => setForm((f) => ({ ...f, heure_fin: e.target.value }))}
                                    InputLabelProps={{ shrink: true }}
                                    required
                                />
                            </Stack>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ justifyContent: dialog.editing ? 'space-between' : 'flex-end' }}>
                        {dialog.editing && (
                            <Button color="error" onClick={() => setASupprimer(dialog.editing)}>
                                {t('ref.common.delete')}
                            </Button>
                        )}
                        <Box>
                            <Button onClick={() => setDialog({ open: false, editing: null })}>{t('common.cancel')}</Button>
                            <Button type="submit" variant="contained" sx={{ ml: 1 }}>
                                {t('common.save')}
                            </Button>
                        </Box>
                    </DialogActions>
                </form>
            </Dialog>

            <ConfirmDialog
                open={Boolean(aSupprimer)}
                title={t('ref.grids.deleteTitle')}
                message={t('ref.grids.deleteBody')}
                onConfirm={supprimer}
                onCancel={() => setASupprimer(null)}
            />
        </DashboardLayout>
    );
}
