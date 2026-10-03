import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Autocomplete,
    Box,
    Button,
    Chip,
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
    ToggleButton,
    ToggleButtonGroup,
    Typography,
} from '@mui/material';
import { Add, Delete, Edit, FileDownloadOutlined, UploadFile, MeetingRoom } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import DataToolbar from '../../design-system/components/DataToolbar';
import EmptyState from '../../design-system/components/EmptyState';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { campusAPI, parametrePlanningAPI, salleAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { parseFile } from '../../utils/fileImport';
import { exportToExcelLazy } from '../../utils/lazyExports';
import { COLS_SALLES } from '../../utils/exportColumns';

const EMPTY_FORM = {
    nom_salle: '',
    type_salle: '',
    id_campus: '',
    capacite: '',
    capacite_examen: '',
    etage: '',
    equipements: [],
    reservable_par: 'admin',
    disponible: true,
};

const MODELE_CSV = [
    'nom_salle;type_salle;capacite;campus;etage;equipements;capacite_examen;reservable_par',
    'G-S01;Salle de cours;38;G;1;Vidéoprojecteur, Tableau blanc;19;admin',
    'ST-LABO01;Labo informatique;28;ST;1;28 postes, AutoCAD;;enseignants',
].join('\n');

const telechargerModele = () => {
    const blob = new Blob([String.fromCharCode(0xfeff) + MODELE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const lien = Object.assign(document.createElement('a'), { href: url, download: 'modele-inventaire-salles.csv' });
    lien.click();
    URL.revokeObjectURL(url);
};

export default function Salles() {
    const { t } = useTranslation();
    const toast = useToast();
    const [salles, setSalles] = useState([]);
    const [campus, setCampus] = useState([]);
    const [types, setTypes] = useState([]);
    const [ratioExamen, setRatioExamen] = useState(0.5);
    const [loading, setLoading] = useState(true);
    const [campusFiltre, setCampusFiltre] = useState('tous');
    const [search, setSearch] = useState('');
    const [dialog, setDialog] = useState({ open: false, editing: null });
    const [form, setForm] = useState(EMPTY_FORM);
    const [formErrors, setFormErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [aSupprimer, setASupprimer] = useState(null);
    const [importState, setImportState] = useState({ open: false, loading: false, erreurs: [] });

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            const [listeSalles, listeCampus, referentiel, parametres] = await Promise.all([
                salleAPI.getAll({ limit: 100 }),
                campusAPI.getAll(),
                salleAPI.getReferentiel(),
                parametrePlanningAPI.getAll().catch(() => null),
            ]);
            setSalles(listeSalles.data || []);
            setCampus(listeCampus || []);
            setTypes(referentiel.types_salle || []);
            if (parametres?.ratio_capacite_examen) setRatioExamen(parametres.ratio_capacite_examen.valeur);
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

    const sallesAffichees = useMemo(() => {
        const terme = search.trim().toLowerCase();
        return salles
            .filter((s) => campusFiltre === 'tous' || s.campus?.code === campusFiltre)
            .filter((s) => {
                if (!terme) return true;
                return [s.nom_salle, s.type_salle, s.campus?.nom, ...(s.equipements || [])]
                    .filter(Boolean)
                    .some((valeur) => String(valeur).toLowerCase().includes(terme));
            });
    }, [salles, campusFiltre, search]);

    const ouvrir = (salle = null) => {
        setFormErrors({});
        setForm(
            salle
                ? {
                      nom_salle: salle.nom_salle,
                      type_salle: salle.type_salle,
                      id_campus: salle.id_campus,
                      capacite: salle.capacite,
                      capacite_examen: salle.capacite_examen ?? '',
                      etage: salle.etage ?? '',
                      equipements: salle.equipements || [],
                      reservable_par: salle.reservable_par || 'admin',
                      disponible: salle.disponible,
                  }
                : { ...EMPTY_FORM, id_campus: campus[0]?.id_campus ?? '' }
        );
        setDialog({ open: true, editing: salle });
    };

    const champ = (nom) => (event) => setForm((f) => ({ ...f, [nom]: event.target.value }));

    const valider = () => {
        const erreurs = {};
        if (!form.nom_salle.trim()) erreurs.nom_salle = t('ref.rooms.required');
        if (!form.type_salle) erreurs.type_salle = t('ref.rooms.required');
        if (!form.id_campus) erreurs.id_campus = t('ref.rooms.required');
        if (!(Number(form.capacite) >= 1)) erreurs.capacite = t('ref.rooms.capacityInvalid');
        if (form.capacite_examen !== '' && Number(form.capacite_examen) > Number(form.capacite)) {
            erreurs.capacite_examen = t('ref.rooms.examTooHigh');
        }
        setFormErrors(erreurs);
        return Object.keys(erreurs).length === 0;
    };

    const enregistrer = async (event) => {
        event.preventDefault();
        if (!valider()) return;
        setSaving(true);
        const data = {
            ...form,
            nom_salle: form.nom_salle.trim(),
            capacite: Number(form.capacite),
            id_campus: Number(form.id_campus),
            capacite_examen: form.capacite_examen === '' ? null : Number(form.capacite_examen),
            etage: form.etage === '' ? null : Number(form.etage),
        };
        try {
            if (dialog.editing) {
                await salleAPI.update(dialog.editing.id_salle, data);
                toast.success(t('ref.rooms.updated'));
            } else {
                await salleAPI.create(data);
                toast.success(t('ref.rooms.created'));
            }
            setDialog({ open: false, editing: null });
            charger();
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        } finally {
            setSaving(false);
        }
    };

    const supprimer = async () => {
        const salle = aSupprimer;
        setASupprimer(null);
        try {
            await salleAPI.delete(salle.id_salle);
            toast.success(t('ref.rooms.deleted'));
            charger();
        } catch (error) {
            toast.error(error.response?.data?.error || error.message);
        }
    };

    const importer = async (fichier) => {
        setImportState((s) => ({ ...s, loading: true, erreurs: [] }));
        try {
            const lignes = await parseFile(fichier);
            const resultat = await salleAPI.importBulk(lignes);
            toast.success(t('ref.rooms.importDone', { crees: resultat.crees, maj: resultat.mises_a_jour }));
            setImportState({ open: false, loading: false, erreurs: [] });
            charger();
        } catch (error) {
            const erreurs = error.response?.data?.erreurs;
            if (erreurs) {
                setImportState((s) => ({ ...s, loading: false, erreurs }));
            } else {
                setImportState((s) => ({ ...s, loading: false }));
                toast.error(error.response?.data?.error || error.message);
            }
        }
    };

    const libelleType = (type) => t(`ref.roomTypes.${type}`, { defaultValue: type });
    const libelleEtage = (etage) => {
        if (etage === null || etage === undefined) return '—';
        if (etage === 0) return t('ref.rooms.groundFloor');
        if (etage < 0) return t('ref.rooms.basement');
        return t('ref.rooms.floorN', { n: etage });
    };

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={campusFiltre}
                        onChange={(_, valeur) => valeur && setCampusFiltre(valeur)}
                        aria-label={t('ref.rooms.cols.campus')}
                    >
                        <ToggleButton value="tous">{t('ref.rooms.allCampuses')}</ToggleButton>
                        {campus.map((c) => (
                            <ToggleButton key={c.id_campus} value={c.code}>
                                {c.nom}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                    <Typography variant="body2" color="text.secondary">
                        {t('ref.rooms.count', { count: sallesAffichees.length })}
                    </Typography>
                </Box>

                <DataToolbar search={search} onSearchChange={setSearch} onExport={() => exportToExcelLazy(sallesAffichees, COLS_SALLES, 'Salles', 'Salles')}>
                    <Button variant="outlined" startIcon={<UploadFile />} onClick={() => setImportState({ open: true, loading: false, erreurs: [] })}>
                        {t('ref.rooms.import')}
                    </Button>
                    <Button variant="contained" startIcon={<Add />} onClick={() => ouvrir()} disabled={campus.length === 0}>
                        {t('ref.rooms.add')}
                    </Button>
                </DataToolbar>

                {loading ? (
                    <TableSkeleton rows={8} />
                ) : salles.length === 0 ? (
                    <EmptyState
                        icon={<MeetingRoom />}
                        title={t('ref.rooms.emptyTitle')}
                        description={t('ref.rooms.emptyBody')}
                        actionLabel={t('ref.rooms.import')}
                        onAction={() => setImportState({ open: true, loading: false, erreurs: [] })}
                    />
                ) : sallesAffichees.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                        {t('ref.rooms.noMatch')}
                    </Typography>
                ) : (
                    <TableContainer>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('ref.rooms.cols.name')}</TableCell>
                                    <TableCell>{t('ref.rooms.cols.type')}</TableCell>
                                    <TableCell>{t('ref.rooms.cols.campus')}</TableCell>
                                    <TableCell align="right">{t('ref.rooms.cols.capacity')}</TableCell>
                                    <TableCell align="right">{t('ref.rooms.cols.exam')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{t('ref.rooms.cols.floor')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{t('ref.rooms.cols.equipment')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.rooms.cols.booking')}</TableCell>
                                    <TableCell>{t('ref.rooms.cols.state')}</TableCell>
                                    <TableCell align="right">{t('ref.rooms.cols.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sallesAffichees.map((salle) => (
                                    <TableRow key={salle.id_salle} hover>
                                        <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{salle.nom_salle}</TableCell>
                                        <TableCell>{libelleType(salle.type_salle)}</TableCell>
                                        <TableCell>{salle.campus?.nom ?? '—'}</TableCell>
                                        <TableCell align="right">{salle.capacite}</TableCell>
                                        <TableCell align="right">{salle.capacite_examen ?? '—'}</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{libelleEtage(salle.etage)}</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' }, maxWidth: 260 }}>
                                            <Typography variant="body2" color="text.secondary" noWrap title={(salle.equipements || []).join(', ')}>
                                                {(salle.equipements || []).join(', ') || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                            {salle.reservable_par === 'enseignants' ? t('ref.rooms.bookingTeachers') : t('ref.rooms.bookingAdmin')}
                                        </TableCell>
                                        <TableCell>
                                            <StateChip tone={salle.disponible ? 'success' : 'danger'}>
                                                {salle.disponible ? t('ref.rooms.available') : t('ref.rooms.unavailable')}
                                            </StateChip>
                                        </TableCell>
                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                            <IconButton size="small" onClick={() => ouvrir(salle)} aria-label={t('ref.common.editItem', { name: salle.nom_salle })}>
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => setASupprimer(salle)} aria-label={t('ref.common.deleteItem', { name: salle.nom_salle })}>
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

            {/* Création / modification */}
            <Dialog open={dialog.open} onClose={() => setDialog({ open: false, editing: null })} maxWidth="sm" fullWidth>
                <form onSubmit={enregistrer} noValidate>
                    <DialogTitle>{dialog.editing ? t('ref.rooms.dialogEdit') : t('ref.rooms.dialogCreate')}</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField
                                label={t('ref.rooms.fields.name')}
                                value={form.nom_salle}
                                onChange={champ('nom_salle')}
                                error={Boolean(formErrors.nom_salle)}
                                helperText={formErrors.nom_salle}
                                required
                                autoFocus
                            />
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField
                                    select
                                    fullWidth
                                    label={t('ref.rooms.fields.type')}
                                    value={form.type_salle}
                                    onChange={champ('type_salle')}
                                    error={Boolean(formErrors.type_salle)}
                                    helperText={formErrors.type_salle}
                                    required
                                >
                                    {types.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {libelleType(type)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    select
                                    fullWidth
                                    label={t('ref.rooms.fields.campus')}
                                    value={form.id_campus}
                                    onChange={champ('id_campus')}
                                    error={Boolean(formErrors.id_campus)}
                                    helperText={formErrors.id_campus}
                                    required
                                >
                                    {campus.map((c) => (
                                        <MenuItem key={c.id_campus} value={c.id_campus}>
                                            {c.nom}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label={t('ref.rooms.fields.capacity')}
                                    value={form.capacite}
                                    onChange={champ('capacite')}
                                    error={Boolean(formErrors.capacite)}
                                    helperText={formErrors.capacite}
                                    inputProps={{ min: 1 }}
                                    required
                                />
                                <TextField
                                    fullWidth
                                    type="number"
                                    label={t('ref.rooms.fields.exam')}
                                    value={form.capacite_examen}
                                    onChange={champ('capacite_examen')}
                                    error={Boolean(formErrors.capacite_examen)}
                                    helperText={formErrors.capacite_examen || t('ref.rooms.fields.examHelp', { ratio: Math.round(ratioExamen * 100) })}
                                    inputProps={{ min: 0 }}
                                />
                                <TextField
                                    fullWidth
                                    type="number"
                                    label={t('ref.rooms.fields.floor')}
                                    value={form.etage}
                                    onChange={champ('etage')}
                                    helperText={t('ref.rooms.fields.floorHelp')}
                                />
                            </Stack>
                            <Autocomplete
                                multiple
                                freeSolo
                                options={[]}
                                value={form.equipements}
                                onChange={(_, valeur) => setForm((f) => ({ ...f, equipements: valeur.map((v) => v.trim()).filter(Boolean) }))}
                                renderTags={(valeur, getTagProps) =>
                                    valeur.map((option, index) => <Chip size="small" label={option} {...getTagProps({ index })} key={option} />)
                                }
                                renderInput={(params) => (
                                    <TextField {...params} label={t('ref.rooms.fields.equipment')} helperText={t('ref.rooms.fields.equipmentHelp')} />
                                )}
                            />
                            <TextField select label={t('ref.rooms.fields.booking')} value={form.reservable_par} onChange={champ('reservable_par')}>
                                <MenuItem value="admin">{t('ref.rooms.bookingAdmin')}</MenuItem>
                                <MenuItem value="enseignants">{t('ref.rooms.bookingTeachers')}</MenuItem>
                            </TextField>
                            <FormControlLabel
                                control={<Switch checked={form.disponible} onChange={(e) => setForm((f) => ({ ...f, disponible: e.target.checked }))} />}
                                label={t('ref.rooms.fields.available')}
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialog({ open: false, editing: null })}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained" disabled={saving}>
                            {t('common.save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Import de l'inventaire */}
            <Dialog open={importState.open} onClose={() => setImportState({ open: false, loading: false, erreurs: [] })} maxWidth="md" fullWidth>
                <DialogTitle>{t('ref.rooms.importTitle')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Typography variant="body2">{t('ref.rooms.importIntro')}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('ref.rooms.importTypes', { types: types.join(', ') })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {t('ref.rooms.importAllOrNothing')}
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                            <Button variant="outlined" startIcon={<FileDownloadOutlined />} onClick={telechargerModele}>
                                {t('ref.rooms.template')}
                            </Button>
                            <Button variant="contained" component="label" startIcon={<UploadFile />} disabled={importState.loading}>
                                {importState.loading ? t('ref.rooms.importing') : t('ref.rooms.chooseFile')}
                                <input
                                    hidden
                                    type="file"
                                    accept=".csv,.xlsx,.xls"
                                    onChange={(e) => {
                                        const fichier = e.target.files?.[0];
                                        e.target.value = '';
                                        if (fichier) importer(fichier);
                                    }}
                                />
                            </Button>
                        </Stack>
                        {importState.erreurs.length > 0 && (
                            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'error.main' }}>
                                    {t('ref.rooms.importErrors', { count: importState.erreurs.length })}
                                </Typography>
                                <Table size="small">
                                    <TableBody>
                                        {importState.erreurs.map((erreur) => (
                                            <TableRow key={erreur.ligne}>
                                                <TableCell sx={{ whiteSpace: 'nowrap', width: 110 }}>{t('ref.rooms.line', { n: erreur.ligne })}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{erreur.nom_salle || '—'}</TableCell>
                                                <TableCell>{erreur.erreurs.join(' · ')}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setImportState({ open: false, loading: false, erreurs: [] })}>{t('common.close')}</Button>
                </DialogActions>
            </Dialog>

            <ConfirmDialog
                open={Boolean(aSupprimer)}
                title={t('ref.rooms.deleteTitle')}
                message={t('ref.rooms.deleteBody', { name: aSupprimer?.nom_salle })}
                onConfirm={supprimer}
                onCancel={() => setASupprimer(null)}
            />
        </DashboardLayout>
    );
}
