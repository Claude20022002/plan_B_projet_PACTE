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
    InputAdornment,
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
import { Add, Delete, Download, Edit, Psychology, Search, UploadFile } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ImportCsvDialog from '../../components/common/ImportCsvDialog';
import EmptyState from '../../design-system/components/EmptyState';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { campusAPI, coursAPI, enseignantAPI, userAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { fetchAll } from '../../utils/fetchAll';
import { exportToExcelLazy } from '../../utils/lazyExports';
import { COLS_ENSEIGNANTS } from '../../utils/exportColumns';
import { ds } from '../../design-system/tokens';

const STATUTS = ['permanent', 'vacataire'];
const FICHE_VIDE = {
    id_user: '',
    specialite: '',
    departement: '',
    grade: '',
    bureau: '',
    statut: 'permanent',
    service_annuel_heures: '',
    max_heures_semaine: '',
    id_campus_prefere: '',
    entreprise: '',
};
const MODELE_CSV = [
    'nom;prenom;email;telephone;specialite;departement;grade;bureau;statut;service_annuel_heures;max_heures_semaine;entreprise',
    'SQUALLI;Nadia;nadia.squalli@hestim.ma;+212600000000;Bases de données;Informatique;Professeur;G-204;permanent;192;18;',
    'TOUZANI;Karim;karim.touzani@hestim.ma;;Cloud;Informatique;Vacataire;;vacataire;;9;ESN casablancaise',
].join('\n');

const nombreOuNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

/**
 * Enseignants : permanents (service annuel dû) et vacataires (heures à la carte), plafond
 * hebdomadaire, campus, compétences, et charge prévue de l'année face au service dû.
 */
export default function Enseignants() {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const [enseignants, setEnseignants] = useState([]);
    const [charges, setCharges] = useState({ annee: null, parId: new Map() });
    const [comptesSansFiche, setComptesSansFiche] = useState([]);
    const [campus, setCampus] = useState([]);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statut, setStatut] = useState('tous');
    const [dialog, setDialog] = useState({ open: false, editing: null, form: FICHE_VIDE });
    const [competences, setCompetences] = useState(null);
    const [aSupprimer, setASupprimer] = useState(null);
    const [importOuvert, setImportOuvert] = useState(false);

    const nombre = useMemo(() => new Intl.NumberFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 1 }), [i18n.language]);

    const charger = useCallback(async () => {
        try {
            const [liste, lesCharges, comptes] = await Promise.all([
                fetchAll(enseignantAPI.getAll),
                enseignantAPI.getCharges(),
                fetchAll(userAPI.getAll, { role: 'enseignant' }),
            ]);
            setEnseignants(liste);
            setCharges({ annee: lesCharges.annee, parId: new Map(lesCharges.charges.map((c) => [c.id_user, c])) });
            const avecFiche = new Set(liste.map((e) => e.id_user));
            setComptesSansFiche(comptes.filter((u) => u.role === 'enseignant' && !avecFiche.has(u.id_user)));
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setLoading(false);
        }
    }, [t, toast]);

    useEffect(() => {
        charger();
        Promise.all([campusAPI.getAll(), fetchAll(coursAPI.getAll)])
            .then(([listeCampus, listeModules]) => {
                setCampus(listeCampus.data ?? listeCampus);
                setModules(listeModules);
            })
            .catch(() => {});
    }, [charger]);

    const erreur = (error) => toast.error(error.response?.data?.error || error.response?.data?.errors?.[0]?.message || error.message);

    const affiches = useMemo(() => {
        const terme = search.trim().toLowerCase();
        return enseignants
            .filter((e) => statut === 'tous' || e.statut === statut)
            .filter((e) => !terme || [e.user?.nom, e.user?.prenom, e.user?.email, e.specialite, e.departement].some((v) => v?.toLowerCase().includes(terme)))
            .sort((a, b) => (a.user?.nom || '').localeCompare(b.user?.nom || '', 'fr') || (a.user?.prenom || '').localeCompare(b.user?.prenom || '', 'fr'));
    }, [enseignants, search, statut]);

    const ouvrir = (enseignant = null) =>
        setDialog({
            open: true,
            editing: enseignant,
            form: enseignant
                ? Object.fromEntries(Object.keys(FICHE_VIDE).map((k) => [k, enseignant[k] ?? '']))
                : FICHE_VIDE,
        });

    const champ = (nom) => (e) => setDialog((d) => ({ ...d, form: { ...d.form, [nom]: e.target.value } }));

    const enregistrer = async (event) => {
        event.preventDefault();
        const f = dialog.form;
        const vacataire = f.statut === 'vacataire';
        const donnees = {
            specialite: f.specialite.trim(),
            departement: f.departement.trim(),
            grade: f.grade.trim() || null,
            bureau: f.bureau.trim() || null,
            statut: f.statut,
            service_annuel_heures: vacataire ? null : nombreOuNull(f.service_annuel_heures),
            max_heures_semaine: nombreOuNull(f.max_heures_semaine),
            id_campus_prefere: nombreOuNull(f.id_campus_prefere),
            entreprise: f.entreprise.trim() || null,
        };
        try {
            if (dialog.editing) {
                await enseignantAPI.update(dialog.editing.id_user, donnees);
                toast.success(t('ref.staff.saved'));
            } else {
                await enseignantAPI.create({ ...donnees, id_user: Number(f.id_user) });
                toast.success(t('ref.staff.created'));
            }
            setDialog((d) => ({ ...d, open: false }));
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    const ouvrirCompetences = async (enseignant) => {
        try {
            const actuels = await enseignantAPI.getCompetences(enseignant.id_user);
            const ids = new Set(actuels.map((c) => c.id_cours));
            setCompetences({ enseignant, choix: modules.filter((m) => ids.has(m.id_cours)) });
        } catch (error) {
            erreur(error);
        }
    };

    const enregistrerCompetences = async () => {
        try {
            await enseignantAPI.setCompetences(competences.enseignant.id_user, competences.choix.map((m) => m.id_cours));
            toast.success(t('ref.staff.skillsSaved'));
            setCompetences(null);
        } catch (error) {
            erreur(error);
        }
    };

    const supprimer = async () => {
        const enseignant = aSupprimer;
        setASupprimer(null);
        try {
            await enseignantAPI.delete(enseignant.id_user);
            toast.success(t('ref.staff.deleted'));
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    const exporter = async () => {
        try {
            await exportToExcelLazy(affiches, COLS_ENSEIGNANTS, 'Enseignants', 'Enseignants');
        } catch (error) {
            erreur(error);
        }
    };

    // L'import serveur traite tout le fichier ; ses erreurs (par email) sont ramenées aux lignes
    const importer = async (lignes) => {
        const reponse = await enseignantAPI.importEnseignants(
            lignes.map((l) => Object.fromEntries(Object.entries(l).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])))
        );
        const ligneDe = (email) => lignes.findIndex((l) => String(l.email || '').trim().toLowerCase() === String(email || '').toLowerCase()) + 2;
        charger();
        return {
            reussies: reponse.successCount ?? reponse.success?.length ?? 0,
            erreurs: (reponse.errors || []).map((e) => ({ ligne: ligneDe(e.email), libelle: e.email, message: e.error })),
        };
    };

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                        <TextField
                            size="small"
                            placeholder={t('ref.staff.search')}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                            inputProps={{ 'aria-label': t('ref.staff.search') }}
                            sx={{ minWidth: 240 }}
                        />
                        <TextField select size="small" label={t('ref.staff.cols.status')} value={statut} onChange={(e) => setStatut(e.target.value)} sx={{ minWidth: 180 }}>
                            <MenuItem value="tous">{t('ref.staff.allStatuses')}</MenuItem>
                            {STATUTS.map((s) => (
                                <MenuItem key={s} value={s}>
                                    {t(`ref.staff.statuses.${s}`)}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button variant="outlined" startIcon={<UploadFile />} onClick={() => setImportOuvert(true)}>
                            {t('ref.import.button')}
                        </Button>
                        <Button variant="outlined" startIcon={<Download />} onClick={exporter} disabled={affiches.length === 0}>
                            {t('ref.import.export')}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => ouvrir()}>
                            {t('ref.staff.add')}
                        </Button>
                    </Stack>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5, maxWidth: 820 }}>
                    {t('ref.staff.intro')}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    {charges.annee ? t('ref.staff.year', { year: charges.annee.libelle }) : t('ref.staff.noYear')} · {t('ref.staff.count', { count: affiches.length })}
                </Typography>

                {loading ? (
                    <TableSkeleton rows={8} />
                ) : enseignants.length === 0 ? (
                    <EmptyState title={t('ref.staff.emptyTitle')} description={t('ref.staff.emptyBody')} actionLabel={t('ref.staff.add')} onAction={() => ouvrir()} />
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('ref.staff.cols.teacher')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.staff.cols.department')}</TableCell>
                                    <TableCell>{t('ref.staff.cols.status')}</TableCell>
                                    <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('ref.staff.cols.due')}</TableCell>
                                    <TableCell align="right">{t('ref.staff.cols.planned')}</TableCell>
                                    <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.staff.cols.weekly')}</TableCell>
                                    <TableCell align="right">{t('ref.rooms.cols.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {affiches.map((e) => {
                                    const nom = `${e.user?.prenom ?? ''} ${e.user?.nom ?? ''}`.trim();
                                    return (
                                        <TableRow key={e.id_user} hover>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {e.user?.nom} {e.user?.prenom}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {e.user?.email}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                <Typography variant="body2">{e.departement}</Typography>
                                                {e.specialite && e.specialite !== e.departement && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {e.specialite}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{t(`ref.staff.statuses.${e.statut}`)}</Typography>
                                                {e.entreprise && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        {e.entreprise}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, fontVariantNumeric: 'tabular-nums' }}>
                                                {e.service_annuel_heures ? `${nombre.format(e.service_annuel_heures)} h` : '-'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Charge charge={charges.parId.get(e.id_user)} nombre={nombre} />
                                            </TableCell>
                                            <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' }, fontVariantNumeric: 'tabular-nums' }}>
                                                {e.max_heures_semaine ? `${nombre.format(e.max_heures_semaine)} h` : '-'}
                                            </TableCell>
                                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                <IconButton size="small" onClick={() => ouvrirCompetences(e)} aria-label={t('ref.staff.skillsTitle', { name: nom })} title={t('ref.staff.skills')}>
                                                    <Psychology fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => ouvrir(e)} aria-label={t('ref.common.editItem', { name: nom })}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => setASupprimer(e)} aria-label={t('ref.common.deleteItem', { name: nom })}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <Dialog open={dialog.open} onClose={() => setDialog((d) => ({ ...d, open: false }))} maxWidth="sm" fullWidth>
                <form onSubmit={enregistrer}>
                    <DialogTitle>
                        {dialog.editing ? t('ref.staff.edit') : t('ref.staff.add')}
                        {dialog.editing && (
                            <Typography variant="body2" color="text.secondary">
                                {dialog.editing.user?.prenom} {dialog.editing.user?.nom}
                            </Typography>
                        )}
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            {!dialog.editing && (
                                <TextField select label={t('ref.staff.fields.user')} helperText={t('ref.staff.fields.userHelp')} value={dialog.form.id_user} onChange={champ('id_user')} required>
                                    {comptesSansFiche.map((u) => (
                                        <MenuItem key={u.id_user} value={u.id_user}>
                                            {u.nom} {u.prenom} · {u.email}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField label={t('ref.staff.fields.department')} value={dialog.form.departement} onChange={champ('departement')} required fullWidth />
                                <TextField label={t('ref.staff.fields.specialty')} value={dialog.form.specialite} onChange={champ('specialite')} required fullWidth />
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField select label={t('ref.staff.fields.status')} value={dialog.form.statut} onChange={champ('statut')} fullWidth>
                                    {STATUTS.map((s) => (
                                        <MenuItem key={s} value={s}>
                                            {t(`ref.staff.statuses.${s}`)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField label={t('ref.staff.fields.grade')} value={dialog.form.grade} onChange={champ('grade')} fullWidth />
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField
                                    type="number"
                                    label={t('ref.staff.fields.due')}
                                    helperText={t('ref.staff.fields.dueHelp')}
                                    value={dialog.form.statut === 'vacataire' ? '' : dialog.form.service_annuel_heures}
                                    onChange={champ('service_annuel_heures')}
                                    disabled={dialog.form.statut === 'vacataire'}
                                    inputProps={{ min: 0, step: 1 }}
                                    fullWidth
                                />
                                <TextField type="number" label={t('ref.staff.fields.weekly')} value={dialog.form.max_heures_semaine} onChange={champ('max_heures_semaine')} inputProps={{ min: 1, step: 0.5 }} fullWidth />
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField select label={t('ref.staff.fields.campus')} value={dialog.form.id_campus_prefere} onChange={champ('id_campus_prefere')} fullWidth>
                                    <MenuItem value="">{t('ref.staff.fields.noCampus')}</MenuItem>
                                    {campus.map((c) => (
                                        <MenuItem key={c.id_campus} value={c.id_campus}>
                                            {c.nom}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField label={t('ref.staff.fields.office')} value={dialog.form.bureau} onChange={champ('bureau')} fullWidth />
                            </Stack>
                            {dialog.form.statut === 'vacataire' && (
                                <TextField label={t('ref.staff.fields.company')} helperText={t('ref.staff.fields.companyHelp')} value={dialog.form.entreprise} onChange={champ('entreprise')} />
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialog((d) => ({ ...d, open: false }))}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained">
                            {t('common.save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <Dialog open={Boolean(competences)} onClose={() => setCompetences(null)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {t('ref.staff.skillsTitle', { name: `${competences?.enseignant.user?.prenom ?? ''} ${competences?.enseignant.user?.nom ?? ''}` })}
                    <Typography variant="body2" color="text.secondary">
                        {t('ref.staff.skillsCount', { count: competences?.choix.length ?? 0 })}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t('ref.staff.skillsHelp')}
                    </Typography>
                    <Autocomplete
                        multiple
                        disableCloseOnSelect
                        options={[...modules].sort((a, b) => (a.filiere?.code_filiere || '').localeCompare(b.filiere?.code_filiere || '') || a.code_cours.localeCompare(b.code_cours))}
                        groupBy={(m) => m.filiere?.code_filiere || '-'}
                        value={competences?.choix ?? []}
                        onChange={(_, valeur) => setCompetences((c) => ({ ...c, choix: valeur }))}
                        getOptionLabel={(m) => `${m.code_cours} · ${m.nom_cours}`}
                        isOptionEqualToValue={(a, b) => a.id_cours === b.id_cours}
                        renderInput={(params) => <TextField {...params} label={t('ref.staff.skillsPick')} />}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCompetences(null)}>{t('common.cancel')}</Button>
                    <Button variant="contained" onClick={enregistrerCompetences}>
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Dialog>

            <ImportCsvDialog
                open={importOuvert}
                onClose={() => setImportOuvert(false)}
                titre={t('ref.staff.importTitle')}
                intro={t('ref.staff.importIntro')}
                modele={MODELE_CSV}
                nomModele="modele-enseignants.csv"
                onImport={importer}
            />

            <ConfirmDialog
                open={Boolean(aSupprimer)}
                title={t('ref.staff.deleteTitle')}
                message={t('ref.staff.deleteBody', { name: `${aSupprimer?.user?.prenom ?? ''} ${aSupprimer?.user?.nom ?? ''}` })}
                onConfirm={supprimer}
                onCancel={() => setASupprimer(null)}
            />
        </DashboardLayout>
    );
}

/**
 * Charge prévue : heures, et pastille seulement au-delà du service dû. Le sous-service n'est pas
 * signalé : tant que tous les semestres ne sont pas préparés, il serait affiché pour tout le monde.
 */
function Charge({ charge, nombre }) {
    const { t } = useTranslation();
    if (!charge) return '-';
    const { heures_prevues: prevues, heures_proposees: proposees, service_du: du } = charge;
    const pastille = du && prevues > du ? <StateChip tone="warning" title={t('ref.staff.overTitle')}>{t('ref.staff.over', { hours: nombre.format(prevues - du) })}</StateChip> : null;
    return (
        <Stack alignItems="flex-end" spacing={0.25}>
            <Stack direction="row" spacing={0.75} alignItems="center">
                {pastille}
                <Typography component="span" sx={{ fontFamily: ds.font.board, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {nombre.format(prevues)} h
                </Typography>
            </Stack>
            {proposees > 0 && (
                <Typography variant="caption" color="text.secondary">
                    {t('ref.staff.pending', { hours: nombre.format(proposees) })}
                </Typography>
            )}
        </Stack>
    );
}
