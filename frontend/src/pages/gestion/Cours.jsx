import { useCallback, useEffect, useMemo, useState } from 'react';
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
import LigneModule from '../../components/cours/LigneModule';
import ModuleDialog from '../../components/cours/ModuleDialog';
import ComposanteDialog from '../../components/cours/ComposanteDialog';
import { importerModules } from '../../components/cours/importerModules';
import { COMPOSANTE_VIDE, MODELE_CSV, MODULE_VIDE, TYPES, nombreOuNull, periodeDe } from '../../components/cours/constantes';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ImportCsvDialog from '../../components/common/ImportCsvDialog';
import DataToolbar from '../../design-system/components/DataToolbar';
import EmptyState from '../../design-system/components/EmptyState';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { composanteAPI, coursAPI, enseignantAPI, filiereAPI, salleAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useAuth } from '../../contexts/AuthContext';
import { filieresGerables } from '../../utils/droits';
import { fetchAll } from '../../utils/fetchAll';
import { exportToExcelLazy } from '../../utils/lazyExports';
import { COLS_COURS } from '../../utils/exportColumns';

/**
 * Maquette pédagogique : les modules (cours) de chaque filière et semestre, et pour chacun
 * ses composantes (CM, TD, TP, Projet) avec volume, groupe visé, séance, modalité et rythme.
 */
export default function Cours() {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const { user } = useAuth();
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
            setFilieres(filieresGerables(listeFilieres, user));
            setEnseignants(listeEnseignants);
            setTypesSalle(referentiel.types_salle || []);
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setLoading(false);
        }
    }, [t, toast, user]);

    useEffect(() => {
        charger();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const idsGerables = useMemo(() => new Set(filieres.map((f) => f.id_filiere)), [filieres]);

    const modulesAffiches = useMemo(() => {
        const terme = search.trim().toLowerCase();
        return modules
            .filter((m) => (filiere === 'toutes' ? idsGerables.has(m.id_filiere) : m.id_filiere === filiere))
            .filter((m) => periode === 'toutes' || periodeDe(m.semestre) === periode)
            .filter((m) => !terme || [m.code_cours, m.nom_cours].some((v) => v?.toLowerCase().includes(terme)))
            .sort((a, b) => (a.filiere?.code_filiere || '').localeCompare(b.filiere?.code_filiere || '') || a.semestre.localeCompare(b.semestre, 'fr', { numeric: true }) || a.code_cours.localeCompare(b.code_cours));
    }, [modules, filiere, periode, search, idsGerables]);

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
        const bilan = await importerModules(lignes, filieres, t);
        if (bilan.reussies) charger();
        return bilan;
    };

    const nomEnseignant = (id) => {
        const e = enseignants.find((x) => x.id_user === id);
        return e ? `${e.user?.prenom || ''} ${e.user?.nom || ''}`.trim() : '-';
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
                                {modulesAffiches.map((module) => (
                                    <LigneModule
                                        key={module.id_cours}
                                        module={module}
                                        ouvert={ouverts.has(module.id_cours)}
                                        nombre={nombre}
                                        nomEnseignant={nomEnseignant}
                                        onBasculer={() => basculer(module.id_cours)}
                                        onModifier={() => ouvrirModule(module)}
                                        onSupprimer={() => setASupprimer({ type: 'module', item: module })}
                                        onAjouterComposante={() => ouvrirComposante(module)}
                                        onModifierComposante={(c) => ouvrirComposante(module, c)}
                                        onSupprimerComposante={(c) => setASupprimer({ type: 'composante', item: c, module })}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <ModuleDialog etat={moduleDialog} setEtat={setModuleDialog} filieres={filieres} enseignants={enseignants} onSubmit={enregistrerModule} />

            <ComposanteDialog etat={composanteDialog} setEtat={setComposanteDialog} typesSalle={typesSalle} onSubmit={enregistrerComposante} />

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
