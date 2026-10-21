import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    IconButton,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { Add, Delete, Edit, ManageAccounts, UploadFile } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ImportCsvDialog from '../../components/common/ImportCsvDialog';
import FiliereDialog from '../../components/filieres/FiliereDialog';
import ResponsablesDialog from '../../components/filieres/ResponsablesDialog';
import DataToolbar from '../../design-system/components/DataToolbar';
import EmptyState from '../../design-system/components/EmptyState';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { filiereAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { fetchAll } from '../../utils/fetchAll';
import { lineColor } from '../../design-system/tokens';

const FILIERE_VIDE = {
    code_filiere: '',
    nom_filiere: '',
    description: '',
    // Plus affichée (R-3) mais obligatoire en base : une filière modifiée garde la sienne
    ecole: 'engineering',
    cycle: '',
    intitule_cycle: '',
    premiere_annee_cycle: '',
    regime: 'initiale',
    partenaire: '',
    annees_a_hestim: '',
};

const MODELE_CSV = [
    'code_filiere;nom_filiere;cycle;intitule_cycle;premiere_annee_cycle;regime;partenaire',
    "IIIA;Informatique & IA;ingenieur;cycle Ingénieur d'Etat;3;initiale;",
].join('\n');

const entierOuNull = (valeur) => (valeur === '' || valeur === null || valeur === undefined ? null : Number(valeur));

/**
 * Filières de HESTIM : cycle et année où il commence, régime, responsables, double diplôme.
 * Ni école (retour du 21 octobre, R-3) ni campus : une filière a cours dans n'importe quel
 * bâtiment, selon les salles libres (décision du 21 octobre 2026).
 */
export default function Filieres() {
    const { t } = useTranslation();
    const toast = useToast();
    const [filieres, setFilieres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [dialog, setDialog] = useState({ open: false, editing: null, form: FILIERE_VIDE });
    const [aSupprimer, setASupprimer] = useState(null);
    const [importOuvert, setImportOuvert] = useState(false);
    const [idResponsables, setIdResponsables] = useState(null);

    const charger = useCallback(async () => {
        setLoading(true);
        try {
            setFilieres(await fetchAll(filiereAPI.getAll));
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
        return filieres.filter((f) => !terme || [f.code_filiere, f.nom_filiere, f.partenaire].some((v) => v?.toLowerCase().includes(terme)));
    }, [filieres, search]);

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
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
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
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.programs.cols.cycle')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.programs.cols.regime')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{t('ref.programs.cols.partner')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{t('ref.programs.heads')}</TableCell>
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
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                            {f.intitule_cycle || (f.cycle ? t(`ref.cycles.${f.cycle}`) : '-')}
                                            {f.premiere_annee_cycle && (
                                                <Typography component="span" variant="body2" color="text.secondary">
                                                    {' · '}
                                                    {t('ref.programs.startsYear', { year: f.premiere_annee_cycle })}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t(`ref.regimes.${f.regime}`)}</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{f.partenaire || '-'}</TableCell>
                                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                            {f.responsables?.length ? (
                                                f.responsables.map((r) => `${r.user?.prenom?.[0] ?? ''}. ${r.user?.nom ?? ''}`).join(', ')
                                            ) : (
                                                <Typography component="span" variant="body2" color="text.secondary">
                                                    {t('ref.programs.headsNone')}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                            <IconButton size="small" onClick={() => setIdResponsables(f.id_filiere)} aria-label={t('ref.programs.headsTitle', { name: f.code_filiere })}>
                                                <ManageAccounts fontSize="small" />
                                            </IconButton>
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

            <FiliereDialog
                ouvert={dialog.open}
                modification={Boolean(dialog.editing)}
                form={dialog.form}
                onChamp={champ}
                onFermer={() => setDialog({ open: false, editing: null, form: FILIERE_VIDE })}
                onEnregistrer={enregistrer}
            />

            <ImportCsvDialog
                open={importOuvert}
                onClose={() => setImportOuvert(false)}
                titre={t('ref.programs.importTitle')}
                intro={t('ref.programs.importIntro')}
                modele={MODELE_CSV}
                nomModele="modele-filieres.csv"
                onImport={importer}
            />

            <ResponsablesDialog filiere={filieres.find((f) => f.id_filiere === idResponsables) ?? null} onClose={() => setIdResponsables(null)} onChange={charger} />

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
