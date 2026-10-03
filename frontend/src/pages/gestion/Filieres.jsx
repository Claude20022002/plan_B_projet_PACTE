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
import { Add, Delete, Edit, UploadFile } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ImportCsvDialog from '../../components/common/ImportCsvDialog';
import DataToolbar from '../../design-system/components/DataToolbar';
import EmptyState from '../../design-system/components/EmptyState';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { campusAPI, filiereAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { fetchAll } from '../../utils/fetchAll';
import { lineColor } from '../../design-system/tokens';

const ECOLES = ['engineering', 'business'];
const CYCLES = ['prepa', 'licence', 'ingenieur', 'master', 'executive'];
const REGIMES = ['initiale', 'continue', 'executive'];

const FILIERE_VIDE = {
    code_filiere: '',
    nom_filiere: '',
    description: '',
    ecole: 'engineering',
    cycle: '',
    intitule_cycle: '',
    premiere_annee_cycle: '',
    regime: 'initiale',
    id_campus_prefere: '',
    partenaire: '',
    annees_a_hestim: '',
};

const MODELE_CSV = [
    'code_filiere;nom_filiere;ecole;cycle;intitule_cycle;premiere_annee_cycle;regime;partenaire',
    "IIIA;Ingénierie Informatique et Intelligence Artificielle;engineering;ingenieur;cycle Ingénieur d'Etat;3;initiale;",
].join('\n');

const entierOuNull = (valeur) => (valeur === '' || valeur === null || valeur === undefined ? null : Number(valeur));

/**
 * Filières de HESTIM : école (ingénieurs ou business), cycle et année où il commence (pour
 * écrire « 2ème année du cycle Ingénieur d'Etat »), régime, campus préféré, double diplôme.
 */
export default function Filieres() {
    const { t } = useTranslation();
    const toast = useToast();
    const [filieres, setFilieres] = useState([]);
    const [campus, setCampus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ecole, setEcole] = useState('toutes');
    const [search, setSearch] = useState('');
    const [dialog, setDialog] = useState({ open: false, editing: null, form: FILIERE_VIDE });
    const [aSupprimer, setASupprimer] = useState(null);
    const [importOuvert, setImportOuvert] = useState(false);

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            const [liste, listeCampus] = await Promise.all([fetchAll(filiereAPI.getAll), campusAPI.getAll()]);
            setFilieres(liste);
            setCampus(listeCampus || []);
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

    const affichees = useMemo(() => {
        const terme = search.trim().toLowerCase();
        return filieres
            .filter((f) => ecole === 'toutes' || f.ecole === ecole)
            .filter((f) => !terme || [f.code_filiere, f.nom_filiere, f.partenaire].some((v) => v?.toLowerCase().includes(terme)));
    }, [filieres, ecole, search]);

    const erreur = (error) => toast.error(error.response?.data?.error || error.response?.data?.errors?.[0]?.message || error.message);

    const ouvrir = (filiere = null) =>
        setDialog({
            open: true,
            editing: filiere,
            form: filiere
                ? Object.fromEntries(Object.keys(FILIERE_VIDE).map((cle) => [cle, filiere[cle] ?? '']))
                : FILIERE_VIDE,
        });

    const champ = (nom) => (e) => setDialog((d) => ({ ...d, form: { ...d.form, [nom]: e.target.value } }));

    const enregistrer = async (event) => {
        event.preventDefault();
        const f = dialog.form;
        const data = {
            code_filiere: f.code_filiere.trim(),
            nom_filiere: f.nom_filiere.trim(),
            description: f.description?.trim() || null,
            ecole: f.ecole,
            cycle: f.cycle || null,
            intitule_cycle: f.intitule_cycle?.trim() || null,
            premiere_annee_cycle: entierOuNull(f.premiere_annee_cycle),
            regime: f.regime,
            id_campus_prefere: entierOuNull(f.id_campus_prefere),
            partenaire: f.partenaire?.trim() || null,
            annees_a_hestim: entierOuNull(f.annees_a_hestim),
        };
        try {
            if (dialog.editing) await filiereAPI.update(dialog.editing.id_filiere, data);
            else await filiereAPI.create(data);
            toast.success(t('ref.programs.saved'));
            setDialog({ open: false, editing: null, form: FILIERE_VIDE });
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    const supprimer = async () => {
        const filiere = aSupprimer;
        setASupprimer(null);
        try {
            await filiereAPI.delete(filiere.id_filiere);
            toast.success(t('ref.programs.deleted'));
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    const importer = async (lignes) => {
        const erreurs = [];
        let reussies = 0;
        for (const [index, ligne] of lignes.entries()) {
            try {
                await filiereAPI.create({
                    code_filiere: String(ligne.code_filiere || '').trim(),
                    nom_filiere: String(ligne.nom_filiere || '').trim(),
                    description: ligne.description || null,
                    ecole: ligne.ecole || 'engineering',
                    cycle: ligne.cycle || null,
                    intitule_cycle: ligne.intitule_cycle || null,
                    premiere_annee_cycle: entierOuNull(ligne.premiere_annee_cycle),
                    regime: ligne.regime || 'initiale',
                    partenaire: ligne.partenaire || null,
                });
                reussies += 1;
            } catch (error) {
                erreurs.push({
                    ligne: index + 2,
                    libelle: ligne.code_filiere,
                    message: error.response?.data?.error || error.response?.data?.errors?.[0]?.message || error.message,
                });
            }
        }
        if (reussies) charger();
        return { reussies, erreurs };
    };

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <ToggleButtonGroup size="small" exclusive value={ecole} onChange={(_, v) => v && setEcole(v)} aria-label={t('ref.programs.fields.school')}>
                        <ToggleButton value="toutes">{t('ref.programs.allSchools')}</ToggleButton>
                        {ECOLES.map((e) => (
                            <ToggleButton key={e} value={e}>
                                {t(`ref.schools.${e}`)}
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                    <Typography variant="body2" color="text.secondary">
                        {t('ref.programs.count', { count: affichees.length })}
                    </Typography>
                </Box>

                <DataToolbar search={search} onSearchChange={setSearch}>
                    <Button variant="outlined" startIcon={<UploadFile />} onClick={() => setImportOuvert(true)}>
                        {t('ref.import.button')}
                    </Button>
                    <Button variant="contained" startIcon={<Add />} onClick={() => ouvrir()}>
                        {t('ref.programs.add')}
                    </Button>
                </DataToolbar>

                {loading ? (
                    <TableSkeleton rows={6} />
                ) : filieres.length === 0 ? (
                    <EmptyState title={t('ref.programs.emptyTitle')} description={t('ref.programs.emptyBody')} actionLabel={t('ref.programs.add')} onAction={() => ouvrir()} />
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('ref.programs.cols.program')}</TableCell>
                                    <TableCell>{t('ref.programs.cols.school')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.programs.cols.cycle')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.programs.cols.regime')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{t('ref.programs.cols.campus')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{t('ref.programs.cols.partner')}</TableCell>
                                    <TableCell align="right">{t('ref.rooms.cols.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {affichees.map((f) => (
                                    <TableRow key={f.id_filiere} hover>
                                        <TableCell>
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Box component="span" aria-hidden sx={{ width: 9, height: 9, borderRadius: '2px', flexShrink: 0, bgcolor: lineColor(f.id_filiere) }} />
                                                <Box sx={{ minWidth: 0 }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {f.nom_filiere}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {f.code_filiere}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                        </TableCell>
                                        <TableCell>{t(`ref.schools.${f.ecole}`)}</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                            {f.intitule_cycle || (f.cycle ? t(`ref.cycles.${f.cycle}`) : '—')}
                                            {f.premiere_annee_cycle && (
                                                <Typography component="span" variant="body2" color="text.secondary">
                                                    {' · '}
                                                    {t('ref.programs.startsYear', { year: f.premiere_annee_cycle })}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t(`ref.regimes.${f.regime}`)}</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{f.campus_prefere?.nom || '—'}</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{f.partenaire || '—'}</TableCell>
                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                            <IconButton size="small" onClick={() => ouvrir(f)} aria-label={t('ref.common.editItem', { name: f.nom_filiere })}>
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error" onClick={() => setASupprimer(f)} aria-label={t('ref.common.deleteItem', { name: f.nom_filiere })}>
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

            <Dialog open={dialog.open} onClose={() => setDialog({ open: false, editing: null, form: FILIERE_VIDE })} maxWidth="sm" fullWidth>
                <form onSubmit={enregistrer}>
                    <DialogTitle>{dialog.editing ? t('ref.programs.edit') : t('ref.programs.add')}</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField label={t('ref.programs.fields.code')} value={dialog.form.code_filiere} onChange={champ('code_filiere')} required autoFocus sx={{ minWidth: 140 }} />
                                <TextField fullWidth label={t('ref.programs.fields.name')} value={dialog.form.nom_filiere} onChange={champ('nom_filiere')} required />
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField select fullWidth label={t('ref.programs.fields.school')} value={dialog.form.ecole} onChange={champ('ecole')}>
                                    {ECOLES.map((e) => (
                                        <MenuItem key={e} value={e}>
                                            {t(`ref.schools.${e}`)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField select fullWidth label={t('ref.programs.fields.regime')} value={dialog.form.regime} onChange={champ('regime')}>
                                    {REGIMES.map((r) => (
                                        <MenuItem key={r} value={r}>
                                            {t(`ref.regimes.${r}`)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField select fullWidth label={t('ref.programs.fields.cycle')} value={dialog.form.cycle} onChange={champ('cycle')}>
                                    <MenuItem value="">—</MenuItem>
                                    {CYCLES.map((c) => (
                                        <MenuItem key={c} value={c}>
                                            {t(`ref.cycles.${c}`)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField type="number" label={t('ref.programs.fields.firstYear')} value={dialog.form.premiere_annee_cycle} onChange={champ('premiere_annee_cycle')} inputProps={{ min: 1, max: 6 }} sx={{ minWidth: 190 }} />
                            </Stack>
                            <TextField
                                label={t('ref.programs.fields.cycleTitle')}
                                value={dialog.form.intitule_cycle}
                                onChange={champ('intitule_cycle')}
                                placeholder="cycle Ingénieur d'Etat"
                                helperText={t('ref.programs.fields.cycleTitleHelp')}
                            />
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField select fullWidth label={t('ref.programs.fields.campus')} value={dialog.form.id_campus_prefere} onChange={champ('id_campus_prefere')}>
                                    <MenuItem value="">—</MenuItem>
                                    {campus.map((c) => (
                                        <MenuItem key={c.id_campus} value={c.id_campus}>
                                            {c.nom}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField fullWidth label={t('ref.programs.fields.partner')} value={dialog.form.partenaire} onChange={champ('partenaire')} placeholder="ESTIA" />
                                <TextField type="number" label={t('ref.programs.fields.yearsHere')} value={dialog.form.annees_a_hestim} onChange={champ('annees_a_hestim')} inputProps={{ min: 1, max: 6 }} sx={{ minWidth: 150 }} />
                            </Stack>
                            <TextField label={t('ref.programs.fields.description')} value={dialog.form.description} onChange={champ('description')} multiline minRows={2} />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialog({ open: false, editing: null, form: FILIERE_VIDE })}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained">
                            {t('common.save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <ImportCsvDialog
                open={importOuvert}
                onClose={() => setImportOuvert(false)}
                titre={t('ref.programs.importTitle')}
                intro={t('ref.programs.importIntro')}
                modele={MODELE_CSV}
                nomModele="modele-filieres.csv"
                onImport={importer}
            />

            <ConfirmDialog
                open={Boolean(aSupprimer)}
                title={t('ref.programs.deleteTitle')}
                message={t('ref.programs.deleteBody', { name: aSupprimer?.nom_filiere })}
                onConfirm={supprimer}
                onCancel={() => setASupprimer(null)}
            />
        </DashboardLayout>
    );
}
