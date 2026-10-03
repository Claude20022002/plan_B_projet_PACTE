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
    InputAdornment,
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
import { Add, Delete, Edit } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { campusAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const EMPTY_FORM = { code: '', nom: '', adresse: '', actif: true };

/** Toutes les paires de campus (a < b), pour la table des temps de trajet. */
const pairesDe = (campus) => {
    const paires = [];
    for (let i = 0; i < campus.length; i += 1) {
        for (let j = i + 1; j < campus.length; j += 1) {
            const [a, b] = [campus[i], campus[j]].sort((x, y) => x.id_campus - y.id_campus);
            paires.push({ a, b, cle: `${a.id_campus}-${b.id_campus}` });
        }
    }
    return paires;
};

export default function Campus() {
    const { t } = useTranslation();
    const toast = useToast();
    const [campus, setCampus] = useState([]);
    const [trajets, setTrajets] = useState({ defaut_minutes: 30, trajets: [] });
    const [minutes, setMinutes] = useState({});
    const [loading, setLoading] = useState(true);
    const [dialog, setDialog] = useState({ open: false, editing: null });
    const [form, setForm] = useState(EMPTY_FORM);
    const [aSupprimer, setASupprimer] = useState(null);

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            const [listeCampus, listeTrajets] = await Promise.all([campusAPI.getAll(), campusAPI.getTrajets()]);
            setCampus(listeCampus || []);
            setTrajets(listeTrajets);
            setMinutes(
                Object.fromEntries((listeTrajets.trajets || []).map((tr) => [`${tr.id_campus_a}-${tr.id_campus_b}`, String(tr.minutes)]))
            );
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setLoading(false);
        }
    }, [t, toast]);

    useEffect(() => {
        charger();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const paires = useMemo(() => pairesDe(campus), [campus]);
    const enregistres = useMemo(
        () => new Map((trajets.trajets || []).map((tr) => [`${tr.id_campus_a}-${tr.id_campus_b}`, tr.minutes])),
        [trajets]
    );

    const ouvrir = (item = null) => {
        setForm(item ? { code: item.code, nom: item.nom, adresse: item.adresse || '', actif: item.actif } : EMPTY_FORM);
        setDialog({ open: true, editing: item });
    };

    const enregistrer = async (event) => {
        event.preventDefault();
        const data = { ...form, code: form.code.trim(), nom: form.nom.trim(), adresse: form.adresse.trim() || null };
        try {
            if (dialog.editing) {
                await campusAPI.update(dialog.editing.id_campus, data);
                toast.success(t('ref.campus.updated'));
            } else {
                await campusAPI.create(data);
                toast.success(t('ref.campus.created'));
            }
            setDialog({ open: false, editing: null });
            charger();
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        }
    };

    const supprimer = async () => {
        const item = aSupprimer;
        setASupprimer(null);
        try {
            await campusAPI.delete(item.id_campus);
            toast.success(t('ref.campus.deleted'));
            charger();
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        }
    };

    const enregistrerTrajet = async ({ a, b, cle }) => {
        const valeur = Number(minutes[cle]);
        if (!Number.isInteger(valeur) || valeur < 0 || valeur > 240) {
            toast.error(t('ref.campus.minutesInvalid'));
            return;
        }
        try {
            await campusAPI.saveTrajet({ id_campus_a: a.id_campus, id_campus_b: b.id_campus, minutes: valeur });
            toast.success(t('ref.campus.travelSaved'));
            charger();
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        }
    };

    return (
        <DashboardLayout>
            <Stack spacing={3}>
                <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                        <Typography variant="body2" color="text.secondary">
                            {t('ref.campus.intro')}
                        </Typography>
                        <Button variant="contained" startIcon={<Add />} onClick={() => ouvrir()}>
                            {t('ref.campus.add')}
                        </Button>
                    </Box>
                    {loading ? (
                        <TableSkeleton rows={2} />
                    ) : (
                        <TableContainer>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>{t('ref.campus.cols.code')}</TableCell>
                                        <TableCell>{t('ref.campus.cols.name')}</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.campus.cols.address')}</TableCell>
                                        <TableCell align="right">{t('ref.campus.cols.rooms')}</TableCell>
                                        <TableCell>{t('ref.campus.cols.state')}</TableCell>
                                        <TableCell align="right">{t('ref.rooms.cols.actions')}</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {campus.map((item) => (
                                        <TableRow key={item.id_campus} hover>
                                            <TableCell sx={{ fontWeight: 600 }}>{item.code}</TableCell>
                                            <TableCell>{item.nom}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, color: item.adresse ? 'text.primary' : 'text.secondary' }}>
                                                {item.adresse || t('ref.campus.addressMissing')}
                                            </TableCell>
                                            <TableCell align="right">{item.nb_salles}</TableCell>
                                            <TableCell>
                                                {item.actif ? (
                                                    <Typography variant="body2" color="text.secondary">
                                                        {t('ref.campus.active')}
                                                    </Typography>
                                                ) : (
                                                    <StateChip tone="warning">{t('ref.campus.inactive')}</StateChip>
                                                )}
                                            </TableCell>
                                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                <IconButton size="small" onClick={() => ouvrir(item)} aria-label={t('ref.common.editItem', { name: item.nom })}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => setASupprimer(item)} aria-label={t('ref.common.deleteItem', { name: item.nom })}>
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

                <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h2" component="h2">
                        {t('ref.campus.travelTitle')}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2, maxWidth: 720 }}>
                        {t('ref.campus.travelIntro', { minutes: trajets.defaut_minutes })}
                    </Typography>
                    {paires.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            {t('ref.campus.needTwo')}
                        </Typography>
                    ) : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('ref.campus.cols.route')}</TableCell>
                                    <TableCell>{t('ref.campus.cols.minutes')}</TableCell>
                                    <TableCell>{t('ref.campus.cols.state')}</TableCell>
                                    <TableCell align="right" />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paires.map((paire) => (
                                    <TableRow key={paire.cle}>
                                        <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                                            {paire.a.nom} ↔ {paire.b.nom}
                                        </TableCell>
                                        <TableCell sx={{ width: 180 }}>
                                            <TextField
                                                size="small"
                                                type="number"
                                                value={minutes[paire.cle] ?? ''}
                                                placeholder={String(trajets.defaut_minutes)}
                                                onChange={(e) => setMinutes((m) => ({ ...m, [paire.cle]: e.target.value }))}
                                                inputProps={{ min: 0, max: 240, 'aria-label': `${paire.a.nom} ↔ ${paire.b.nom}` }}
                                                InputProps={{ endAdornment: <InputAdornment position="end">min</InputAdornment> }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {enregistres.has(paire.cle) ? (
                                                <StateChip tone="success">{t('ref.campus.travelSet')}</StateChip>
                                            ) : (
                                                <StateChip tone="neutral">{t('ref.campus.travelDefault', { minutes: trajets.defaut_minutes })}</StateChip>
                                            )}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button size="small" variant="outlined" onClick={() => enregistrerTrajet(paire)} disabled={minutes[paire.cle] === undefined || minutes[paire.cle] === ''}>
                                                {t('common.save')}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Paper>
            </Stack>

            <Dialog open={dialog.open} onClose={() => setDialog({ open: false, editing: null })} maxWidth="xs" fullWidth>
                <form onSubmit={enregistrer}>
                    <DialogTitle>{dialog.editing ? t('ref.campus.dialogEdit') : t('ref.campus.dialogCreate')}</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label={t('ref.campus.fields.code')}
                                value={form.code}
                                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                                helperText={t('ref.campus.fields.codeHelp')}
                                inputProps={{ maxLength: 10, pattern: '[A-Za-z0-9]{1,10}' }}
                                required
                                autoFocus
                            />
                            <TextField label={t('ref.campus.fields.name')} value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} required />
                            <TextField
                                label={t('ref.campus.fields.address')}
                                value={form.adresse}
                                onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
                                multiline
                                minRows={2}
                            />
                            <FormControlLabel
                                control={<Switch checked={form.actif} onChange={(e) => setForm((f) => ({ ...f, actif: e.target.checked }))} />}
                                label={t('ref.campus.active')}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialog({ open: false, editing: null })}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained">
                            {t('common.save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <ConfirmDialog
                open={Boolean(aSupprimer)}
                title={t('ref.campus.deleteTitle')}
                message={t('ref.campus.deleteBody', { name: aSupprimer?.nom })}
                onConfirm={supprimer}
                onCancel={() => setASupprimer(null)}
            />
        </DashboardLayout>
    );
}
