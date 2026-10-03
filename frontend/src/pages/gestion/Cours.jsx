import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Collapse,
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
import { Add, Delete, Edit, KeyboardArrowDown, KeyboardArrowRight, UploadFile } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ImportCsvDialog from '../../components/common/ImportCsvDialog';
import DataToolbar from '../../design-system/components/DataToolbar';
import EmptyState from '../../design-system/components/EmptyState';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { composanteAPI, coursAPI, enseignantAPI, filiereAPI, salleAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { fetchAll } from '../../utils/fetchAll';
import { exportToExcelLazy } from '../../utils/lazyExports';
import { COLS_COURS } from '../../utils/exportColumns';
import { ds, lineColor } from '../../design-system/tokens';

const SEMESTRES = Array.from({ length: 10 }, (_, i) => `S${i + 1}`);
const TYPES = ['CM', 'TD', 'TP', 'Projet'];
const NIVEAUX_GROUPE = ['promotion', 'td', 'tp'];
const MODALITES = ['presentiel', 'distanciel', 'hybride'];

const MODULE_VIDE = {
    code_cours: '',
    nom_cours: '',
    id_filiere: '',
    niveau: '',
    semestre: 'S1',
    type_cours: 'CM',
    volume_horaire: '',
    ects: '',
    coefficient: 1,
    id_responsable: '',
};

const COMPOSANTE_VIDE = {
    type: 'TD',
    volume_heures: '',
    niveau_groupe: 'td',
    creneaux_par_seance: 2,
    modalite: 'presentiel',
    mention: '',
    type_salle_requis: '',
    semaine_debut: '',
    semaine_fin: '',
    seances_par_semaine: '',
};

const MODELE_CSV = [
    'code_cours;nom_cours;code_filiere;niveau;semestre;type_cours;volume_horaire;ects;coefficient',
    'IIIA-4-TLC;Théorie des langages et Compilation;IIIA;4ème année;S7;CM;21;3;1',
].join('\n');

const periodeDe = (semestre) => {
    const numero = Number(String(semestre || '').match(/\d+/)?.[0]);
    if (!numero) return null;
    return numero % 2 === 1 ? 'S1' : 'S2';
};

const nombreOuNull = (valeur) => (valeur === '' || valeur === null || valeur === undefined ? null : Number(valeur));

/**
 * Maquette pédagogique : les modules (cours) de chaque filière et semestre, et pour chacun
 * ses composantes (CM, TD, TP, Projet) avec volume, groupe visé, séance, modalité et rythme.
 */
export default function Cours() {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const [modules, setModules] = useState([]);
    const [filieres, setFilieres] = useState([]);
    const [enseignants, setEnseignants] = useState([]);
    const [typesSalle, setTypesSalle] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filiere, setFiliere] = useState('toutes');
    const [periode, setPeriode] = useState('toutes');
    const [search, setSearch] = useState('');
    const [ouverts, setOuverts] = useState(() => new Set());
    const [moduleDialog, setModuleDialog] = useState({ open: false, editing: null, form: MODULE_VIDE });
    const [composanteDialog, setComposanteDialog] = useState({ open: false, module: null, editing: null, form: COMPOSANTE_VIDE });
    const [aSupprimer, setASupprimer] = useState(null);
    const [importOuvert, setImportOuvert] = useState(false);

    const nombre = useMemo(() => new Intl.NumberFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 1 }), [i18n.language]);

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            const [liste, listeFilieres, listeEnseignants, referentiel] = await Promise.all([
                fetchAll(coursAPI.getAll),
                fetchAll(filiereAPI.getAll),
                fetchAll(enseignantAPI.getAll),
                salleAPI.getReferentiel(),
            ]);
            setModules(liste);
            setFilieres(listeFilieres);
            setEnseignants(listeEnseignants);
            setTypesSalle(referentiel.types_salle || []);
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

    const modulesAffiches = useMemo(() => {
        const terme = search.trim().toLowerCase();
        return modules
            .filter((m) => filiere === 'toutes' || m.id_filiere === filiere)
            .filter((m) => periode === 'toutes' || periodeDe(m.semestre) === periode)
            .filter((m) => !terme || [m.code_cours, m.nom_cours].some((v) => v?.toLowerCase().includes(terme)))
            .sort((a, b) => (a.filiere?.code_filiere || '').localeCompare(b.filiere?.code_filiere || '') || a.semestre.localeCompare(b.semestre, 'fr', { numeric: true }) || a.code_cours.localeCompare(b.code_cours));
    }, [modules, filiere, periode, search]);

    const erreur = (error) => toast.error(error.response?.data?.error || error.response?.data?.errors?.[0]?.message || error.message);

    const basculer = (id) =>
        setOuverts((s) => {
            const suivant = new Set(s);
            if (suivant.has(id)) suivant.delete(id);
            else suivant.add(id);
            return suivant;
        });

    // ── Modules ───────────────────────────────────────────────────────────
    const ouvrirModule = (module = null) =>
        setModuleDialog({
            open: true,
            editing: module,
            form: module
                ? {
                      ...MODULE_VIDE,
                      ...module,
                      ects: module.ects ?? '',
                      id_responsable: module.id_responsable ?? '',
                  }
                : { ...MODULE_VIDE, id_filiere: filiere === 'toutes' ? filieres[0]?.id_filiere ?? '' : filiere },
        });

    const champModule = (nom) => (e) => setModuleDialog((d) => ({ ...d, form: { ...d.form, [nom]: e.target.value } }));

    const enregistrerModule = async (event) => {
        event.preventDefault();
        const f = moduleDialog.form;
        const data = {
            code_cours: f.code_cours.trim(),
            nom_cours: f.nom_cours.trim(),
            id_filiere: Number(f.id_filiere),
            niveau: f.niveau.trim(),
            semestre: f.semestre,
            ects: nombreOuNull(f.ects),
            coefficient: Number(f.coefficient) || 1,
            id_responsable: nombreOuNull(f.id_responsable),
        };
        if (!moduleDialog.editing) {
            data.type_cours = f.type_cours;
            data.volume_horaire = Number(f.volume_horaire);
        }
        try {
            if (moduleDialog.editing) await coursAPI.update(moduleDialog.editing.id_cours, data);
            else await coursAPI.create(data);
            toast.success(t('ref.curriculum.moduleSaved'));
            setModuleDialog({ open: false, editing: null, form: MODULE_VIDE });
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    // ── Composantes ───────────────────────────────────────────────────────
    const ouvrirComposante = (module, composante = null) =>
        setComposanteDialog({
            open: true,
            module,
            editing: composante,
            form: composante
                ? {
                      ...COMPOSANTE_VIDE,
                      ...composante,
                      mention: composante.mention || '',
                      type_salle_requis: composante.type_salle_requis || '',
                      semaine_debut: composante.semaine_debut ?? '',
                      semaine_fin: composante.semaine_fin ?? '',
                      seances_par_semaine: composante.seances_par_semaine ?? '',
                  }
                : { ...COMPOSANTE_VIDE, type: TYPES.find((type) => !module.composantes.some((c) => c.type === type)) || 'TD' },
        });

    const champComposante = (nom) => (e) =>
        setComposanteDialog((d) => {
            const form = { ...d.form, [nom]: e.target.value };
            // Le groupe visé suit le type tant que l'utilisateur ne l'a pas choisi lui-même
            if (nom === 'type' && !d.editing) form.niveau_groupe = { CM: 'promotion', TD: 'td', TP: 'tp', Projet: 'td' }[e.target.value];
            return { ...d, form };
        });

    const enregistrerComposante = async (event) => {
        event.preventDefault();
        const f = composanteDialog.form;
        const data = {
            type: f.type,
            volume_heures: Number(f.volume_heures),
            niveau_groupe: f.niveau_groupe,
            creneaux_par_seance: Number(f.creneaux_par_seance),
            modalite: f.modalite,
            mention: f.mention.trim() || null,
            type_salle_requis: f.modalite === 'distanciel' ? null : f.type_salle_requis || null,
            semaine_debut: nombreOuNull(f.semaine_debut),
            semaine_fin: nombreOuNull(f.semaine_fin),
            seances_par_semaine: nombreOuNull(f.seances_par_semaine),
        };
        try {
            if (composanteDialog.editing) await composanteAPI.update(composanteDialog.editing.id_composante, data);
            else await coursAPI.createComposante(composanteDialog.module.id_cours, data);
            toast.success(t('ref.curriculum.componentSaved'));
            setOuverts((s) => new Set(s).add(composanteDialog.module.id_cours));
            setComposanteDialog({ open: false, module: null, editing: null, form: COMPOSANTE_VIDE });
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    const supprimer = async () => {
        const { type, item } = aSupprimer;
        setASupprimer(null);
        try {
            if (type === 'module') await coursAPI.delete(item.id_cours);
            else await composanteAPI.delete(item.id_composante);
            toast.success(t('ref.curriculum.deleted'));
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    // ── Import ligne à ligne ──────────────────────────────────────────────
    const importer = async (lignes) => {
        const parCode = new Map(filieres.map((f) => [f.code_filiere.toLowerCase(), f.id_filiere]));
        const erreurs = [];
        let reussies = 0;
        for (const [index, ligne] of lignes.entries()) {
            const idFiliere = parCode.get(String(ligne.code_filiere || '').trim().toLowerCase()) ?? nombreOuNull(ligne.id_filiere);
            try {
                if (!idFiliere) throw new Error(t('ref.curriculum.unknownProgram', { code: ligne.code_filiere || '' }));
                await coursAPI.create({
                    code_cours: String(ligne.code_cours || '').trim(),
                    nom_cours: String(ligne.nom_cours || '').trim(),
                    id_filiere: idFiliere,
                    niveau: String(ligne.niveau || '').trim(),
                    semestre: String(ligne.semestre || '').trim().toUpperCase(),
                    type_cours: String(ligne.type_cours || 'CM').trim(),
                    volume_horaire: Number(ligne.volume_horaire),
                    ects: nombreOuNull(ligne.ects),
                    coefficient: Number(ligne.coefficient) || 1,
                });
                reussies += 1;
            } catch (error) {
                erreurs.push({
                    ligne: index + 2,
                    libelle: ligne.code_cours,
                    message: error.response?.data?.error || error.response?.data?.errors?.[0]?.message || error.message,
                });
            }
        }
        if (reussies) charger();
        return { reussies, erreurs };
    };

    const libelleSeance = (n) => (Number(n) === 2 ? t('ref.curriculum.halfDay') : t('ref.curriculum.slots', { count: Number(n) }));
    const rythme = (c) => {
        if (!c.semaine_debut && !c.seances_par_semaine) return '—';
        const semaines = c.semaine_debut ? t('ref.curriculum.weeksRange', { from: c.semaine_debut, to: c.semaine_fin || c.semaine_debut }) : '';
        const parSemaine = c.seances_par_semaine ? t('ref.curriculum.perWeek', { count: c.seances_par_semaine }) : '';
        return [semaines, parSemaine].filter(Boolean).join(' · ');
    };
    const volumeTotal = (m) => m.composantes.reduce((total, c) => total + (Number(c.volume_heures) || 0), 0);
    const nomEnseignant = (id) => {
        const e = enseignants.find((x) => x.id_user === id);
        return e ? `${e.user?.prenom || ''} ${e.user?.nom || ''}`.trim() : '—';
    };

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                        <TextField select size="small" label={t('ref.curriculum.program')} value={filiere} onChange={(e) => setFiliere(e.target.value)} sx={{ minWidth: 220 }}>
                            <MenuItem value="toutes">{t('ref.curriculum.allPrograms')}</MenuItem>
                            {filieres.map((f) => (
                                <MenuItem key={f.id_filiere} value={f.id_filiere}>
                                    {f.code_filiere} · {f.nom_filiere}
                                </MenuItem>
                            ))}
                        </TextField>
                        <ToggleButtonGroup size="small" exclusive value={periode} onChange={(_, v) => v && setPeriode(v)} aria-label={t('ref.curriculum.period')}>
                            <ToggleButton value="toutes">{t('ref.curriculum.allSemesters')}</ToggleButton>
                            <ToggleButton value="S1">{t('ref.curriculum.oddSemesters')}</ToggleButton>
                            <ToggleButton value="S2">{t('ref.curriculum.evenSemesters')}</ToggleButton>
                        </ToggleButtonGroup>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        {t('ref.curriculum.count', { count: modulesAffiches.length })}
                    </Typography>
                </Box>

                <DataToolbar search={search} onSearchChange={setSearch} onExport={() => exportToExcelLazy(modulesAffiches, COLS_COURS, 'Maquette', 'Maquette')}>
                    <Button variant="outlined" startIcon={<UploadFile />} onClick={() => setImportOuvert(true)}>
                        {t('ref.import.button')}
                    </Button>
                    <Button variant="contained" startIcon={<Add />} onClick={() => ouvrirModule()} disabled={filieres.length === 0}>
                        {t('ref.curriculum.addModule')}
                    </Button>
                </DataToolbar>

                {loading ? (
                    <TableSkeleton rows={8} />
                ) : modules.length === 0 ? (
                    <EmptyState title={t('ref.curriculum.emptyTitle')} description={t('ref.curriculum.emptyBody')} actionLabel={t('ref.curriculum.addModule')} onAction={() => ouvrirModule()} />
                ) : modulesAffiches.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                        {t('ref.curriculum.noMatch')}
                    </Typography>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: 40 }} />
                                    <TableCell>{t('ref.curriculum.cols.module')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.curriculum.cols.program')}</TableCell>
                                    <TableCell>{t('ref.curriculum.cols.semester')}</TableCell>
                                    <TableCell>{t('ref.curriculum.cols.components')}</TableCell>
                                    <TableCell align="right">{t('ref.curriculum.cols.volume')}</TableCell>
                                    <TableCell align="right" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{t('ref.curriculum.cols.ects')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{t('ref.curriculum.cols.lead')}</TableCell>
                                    <TableCell align="right">{t('ref.rooms.cols.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {modulesAffiches.map((module) => {
                                    const ouvert = ouverts.has(module.id_cours);
                                    return (
                                        <Fragment key={module.id_cours}>
                                            <TableRow hover sx={{ '& > td': { borderBottom: ouvert ? 0 : undefined } }}>
                                                <TableCell sx={{ px: 0.5 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => basculer(module.id_cours)}
                                                        aria-expanded={ouvert}
                                                        aria-label={t(ouvert ? 'ref.curriculum.collapse' : 'ref.curriculum.expand', { name: module.nom_cours })}
                                                    >
                                                        {ouvert ? <KeyboardArrowDown fontSize="small" /> : <KeyboardArrowRight fontSize="small" />}
                                                    </IconButton>
                                                </TableCell>
                                                <TableCell>
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Box component="span" aria-hidden sx={{ width: 9, height: 9, borderRadius: '2px', flexShrink: 0, bgcolor: lineColor(module.id_filiere) }} />
                                                        <Box sx={{ minWidth: 0 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {module.nom_cours}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {module.code_cours} · {module.niveau}
                                                            </Typography>
                                                        </Box>
                                                    </Stack>
                                                </TableCell>
                                                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{module.filiere?.code_filiere}</TableCell>
                                                <TableCell sx={{ fontFamily: ds.font.board, fontWeight: 600 }}>{module.semestre}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                                                        {module.composantes.map((c) => `${c.type} ${nombre.format(c.volume_heures)} h`).join(' · ') || '—'}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{nombre.format(volumeTotal(module))} h</TableCell>
                                                <TableCell align="right" sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{module.ects ?? '—'}</TableCell>
                                                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{module.id_responsable ? nomEnseignant(module.id_responsable) : '—'}</TableCell>
                                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                    <IconButton size="small" onClick={() => ouvrirModule(module)} aria-label={t('ref.common.editItem', { name: module.nom_cours })}>
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => setASupprimer({ type: 'module', item: module })} aria-label={t('ref.common.deleteItem', { name: module.nom_cours })}>
                                                        <Delete fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell colSpan={9} sx={{ py: 0, px: { xs: 0.5, md: 2 }, borderBottom: ouvert ? undefined : 0 }}>
                                                    <Collapse in={ouvert} timeout="auto" unmountOnExit>
                                                        <Box sx={{ pl: { md: 5 }, pb: 2, pt: 0.5 }}>
                                                            <Table size="small" aria-label={t('ref.curriculum.componentsOf', { name: module.nom_cours })}>
                                                                <TableHead>
                                                                    <TableRow>
                                                                        <TableCell>{t('ref.curriculum.compCols.type')}</TableCell>
                                                                        <TableCell align="right">{t('ref.curriculum.compCols.volume')}</TableCell>
                                                                        <TableCell>{t('ref.curriculum.compCols.group')}</TableCell>
                                                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.curriculum.compCols.session')}</TableCell>
                                                                        <TableCell>{t('ref.curriculum.compCols.mode')}</TableCell>
                                                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.curriculum.compCols.room')}</TableCell>
                                                                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{t('ref.curriculum.compCols.rhythm')}</TableCell>
                                                                        <TableCell align="right" />
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {module.composantes.map((c) => (
                                                                        <TableRow key={c.id_composante}>
                                                                            <TableCell sx={{ fontFamily: ds.font.board, fontWeight: 600 }}>{c.type}</TableCell>
                                                                            <TableCell align="right">{nombre.format(c.volume_heures)} h</TableCell>
                                                                            <TableCell>{t(`ref.groupTypes.${c.niveau_groupe}`)}</TableCell>
                                                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{libelleSeance(c.creneaux_par_seance)}</TableCell>
                                                                            <TableCell>
                                                                                {c.modalite === 'presentiel' ? (
                                                                                    <Typography variant="body2" color="text.secondary">
                                                                                        {t('ref.modes.presentiel')}
                                                                                    </Typography>
                                                                                ) : (
                                                                                    <StateChip tone="info" title={c.mention || undefined}>
                                                                                        {t(`ref.modes.${c.modalite}`)}
                                                                                    </StateChip>
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                                                                {c.type_salle_requis ? t(`ref.roomTypes.${c.type_salle_requis}`, { defaultValue: c.type_salle_requis }) : '—'}
                                                                            </TableCell>
                                                                            <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{rythme(c)}</TableCell>
                                                                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                                                <IconButton size="small" onClick={() => ouvrirComposante(module, c)} aria-label={t('ref.common.editItem', { name: `${module.nom_cours} ${c.type}` })}>
                                                                                    <Edit fontSize="small" />
                                                                                </IconButton>
                                                                                <IconButton size="small" color="error" onClick={() => setASupprimer({ type: 'composante', item: c, module })} aria-label={t('ref.common.deleteItem', { name: `${module.nom_cours} ${c.type}` })}>
                                                                                    <Delete fontSize="small" />
                                                                                </IconButton>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                            {module.composantes.length < TYPES.length && (
                                                                <Button size="small" startIcon={<Add />} onClick={() => ouvrirComposante(module)} sx={{ mt: 1 }}>
                                                                    {t('ref.curriculum.addComponent')}
                                                                </Button>
                                                            )}
                                                        </Box>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        </Fragment>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            {/* Module */}
            <Dialog open={moduleDialog.open} onClose={() => setModuleDialog({ open: false, editing: null, form: MODULE_VIDE })} maxWidth="sm" fullWidth>
                <form onSubmit={enregistrerModule}>
                    <DialogTitle>{moduleDialog.editing ? t('ref.curriculum.editModule') : t('ref.curriculum.addModule')}</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField label={t('ref.curriculum.fields.code')} value={moduleDialog.form.code_cours} onChange={champModule('code_cours')} required autoFocus sx={{ minWidth: 180 }} />
                                <TextField fullWidth label={t('ref.curriculum.fields.name')} value={moduleDialog.form.nom_cours} onChange={champModule('nom_cours')} required />
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField select fullWidth label={t('ref.curriculum.fields.program')} value={moduleDialog.form.id_filiere} onChange={champModule('id_filiere')} required>
                                    {filieres.map((f) => (
                                        <MenuItem key={f.id_filiere} value={f.id_filiere}>
                                            {f.code_filiere} · {f.nom_filiere}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField fullWidth label={t('ref.curriculum.fields.level')} value={moduleDialog.form.niveau} onChange={champModule('niveau')} placeholder="4ème année" required />
                                <TextField select label={t('ref.curriculum.fields.semester')} value={moduleDialog.form.semestre} onChange={champModule('semestre')} sx={{ minWidth: 110 }}>
                                    {SEMESTRES.map((s) => (
                                        <MenuItem key={s} value={s}>
                                            {s}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Stack>
                            {!moduleDialog.editing && (
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField select fullWidth label={t('ref.curriculum.fields.firstComponent')} value={moduleDialog.form.type_cours} onChange={champModule('type_cours')}>
                                        {TYPES.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField fullWidth type="number" label={t('ref.curriculum.fields.volume')} value={moduleDialog.form.volume_horaire} onChange={champModule('volume_horaire')} inputProps={{ min: 1 }} required />
                                </Stack>
                            )}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField fullWidth type="number" label={t('ref.curriculum.fields.ects')} value={moduleDialog.form.ects} onChange={champModule('ects')} inputProps={{ min: 0, step: 0.5 }} />
                                <TextField fullWidth type="number" label={t('ref.curriculum.fields.coefficient')} value={moduleDialog.form.coefficient} onChange={champModule('coefficient')} inputProps={{ min: 0, step: 0.5 }} />
                                <TextField select fullWidth label={t('ref.curriculum.fields.lead')} value={moduleDialog.form.id_responsable} onChange={champModule('id_responsable')}>
                                    <MenuItem value="">—</MenuItem>
                                    {enseignants.map((e) => (
                                        <MenuItem key={e.id_user} value={e.id_user}>
                                            {e.user?.prenom} {e.user?.nom}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Stack>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setModuleDialog({ open: false, editing: null, form: MODULE_VIDE })}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained">
                            {t('common.save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            {/* Composante */}
            <Dialog open={composanteDialog.open} onClose={() => setComposanteDialog({ open: false, module: null, editing: null, form: COMPOSANTE_VIDE })} maxWidth="sm" fullWidth>
                <form onSubmit={enregistrerComposante}>
                    <DialogTitle>
                        {composanteDialog.editing ? t('ref.curriculum.editComponent') : t('ref.curriculum.addComponent')}
                        <Typography variant="body2" color="text.secondary">
                            {composanteDialog.module?.nom_cours}
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField select fullWidth label={t('ref.curriculum.compFields.type')} value={composanteDialog.form.type} onChange={champComposante('type')}>
                                    {TYPES.map((type) => (
                                        <MenuItem key={type} value={type} disabled={!composanteDialog.editing && composanteDialog.module?.composantes.some((c) => c.type === type)}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField fullWidth type="number" label={t('ref.curriculum.compFields.volume')} value={composanteDialog.form.volume_heures} onChange={champComposante('volume_heures')} inputProps={{ min: 0.5, step: 0.5 }} required />
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField select fullWidth label={t('ref.curriculum.compFields.group')} value={composanteDialog.form.niveau_groupe} onChange={champComposante('niveau_groupe')}>
                                    {NIVEAUX_GROUPE.map((n) => (
                                        <MenuItem key={n} value={n}>
                                            {t(`ref.groupTypes.${n}`)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField
                                    select
                                    fullWidth
                                    label={t('ref.curriculum.compFields.session')}
                                    value={composanteDialog.form.creneaux_par_seance}
                                    onChange={champComposante('creneaux_par_seance')}
                                    helperText={t('ref.curriculum.compFields.sessionHelp')}
                                >
                                    {[1, 2, 3, 4].map((n) => (
                                        <MenuItem key={n} value={n}>
                                            {libelleSeance(n)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField select fullWidth label={t('ref.curriculum.compFields.mode')} value={composanteDialog.form.modalite} onChange={champComposante('modalite')}>
                                    {MODALITES.map((m) => (
                                        <MenuItem key={m} value={m}>
                                            {t(`ref.modes.${m}`)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField fullWidth label={t('ref.curriculum.compFields.mention')} value={composanteDialog.form.mention} onChange={champComposante('mention')} placeholder="Blended Coursera" />
                            </Stack>
                            {composanteDialog.form.modalite !== 'distanciel' && (
                                <TextField select label={t('ref.curriculum.compFields.room')} value={composanteDialog.form.type_salle_requis} onChange={champComposante('type_salle_requis')}>
                                    <MenuItem value="">{t('ref.curriculum.compFields.anyRoom')}</MenuItem>
                                    {typesSalle.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {t(`ref.roomTypes.${type}`, { defaultValue: type })}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                            <Box>
                                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                    {t('ref.curriculum.compFields.rhythm')}
                                </Typography>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                    <TextField fullWidth type="number" label={t('ref.curriculum.compFields.weekStart')} value={composanteDialog.form.semaine_debut} onChange={champComposante('semaine_debut')} inputProps={{ min: 1, max: 30 }} />
                                    <TextField fullWidth type="number" label={t('ref.curriculum.compFields.weekEnd')} value={composanteDialog.form.semaine_fin} onChange={champComposante('semaine_fin')} inputProps={{ min: 1, max: 30 }} />
                                    <TextField fullWidth type="number" label={t('ref.curriculum.compFields.perWeek')} value={composanteDialog.form.seances_par_semaine} onChange={champComposante('seances_par_semaine')} inputProps={{ min: 1, max: 20 }} />
                                </Stack>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                                    {t('ref.curriculum.compFields.rhythmHelp')}
                                </Typography>
                            </Box>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setComposanteDialog({ open: false, module: null, editing: null, form: COMPOSANTE_VIDE })}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained">
                            {t('common.save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <ImportCsvDialog
                open={importOuvert}
                onClose={() => setImportOuvert(false)}
                titre={t('ref.curriculum.importTitle')}
                intro={t('ref.curriculum.importIntro')}
                modele={MODELE_CSV}
                nomModele="modele-maquette.csv"
                onImport={importer}
            />

            <ConfirmDialog
                open={Boolean(aSupprimer)}
                title={t('ref.curriculum.deleteTitle')}
                message={
                    aSupprimer?.type === 'module'
                        ? t('ref.curriculum.deleteModuleBody', { name: aSupprimer.item.nom_cours })
                        : t('ref.curriculum.deleteComponentBody', { type: aSupprimer?.item?.type, name: aSupprimer?.module?.nom_cours })
                }
                onConfirm={supprimer}
                onCancel={() => setASupprimer(null)}
            />
        </DashboardLayout>
    );
}
