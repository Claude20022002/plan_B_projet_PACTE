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
    Tooltip,
    Typography,
} from '@mui/material';
import { Add, Delete, Edit, SubdirectoryArrowRight, UploadFile } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ImportCsvDialog from '../../components/common/ImportCsvDialog';
import EmptyState from '../../design-system/components/EmptyState';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { filiereAPI, groupeAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { fetchAll } from '../../utils/fetchAll';
import { exportToExcelLazy } from '../../utils/lazyExports';
import { COLS_GROUPES } from '../../utils/exportColumns';
import { ds, lineColor } from '../../design-system/tokens';

// Type d'un sous-groupe selon son parent : promotion → TD → TP
const ENFANT_DE = { promotion: 'td', td: 'tp' };

const anneeScolaireCourante = () => {
    const d = new Date();
    const debut = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
    return `${debut}-${debut + 1}`;
};

const GROUPE_VIDE = { nom_groupe: '', niveau: '', effectif: 0, annee_scolaire: anneeScolaireCourante(), id_filiere: '', type_groupe: 'promotion', id_groupe_parent: null, annee: '' };

const MODELE_CSV = [
    'nom_groupe;code_filiere;niveau;annee;effectif;annee_scolaire;type_groupe;parent',
    '4A IIIA;IIIA;4ème année;4;44;2026-2027;promotion;',
    'IIIA-4A;IIIA;4ème année;4;22;2026-2027;td;4A IIIA',
].join('\n');

/** Aplatit l'arbre en lignes avec leur profondeur (affichage en retrait). */
const aplatir = (noeuds, profondeur = 0) =>
    noeuds.flatMap((n) => [{ ...n, profondeur }, ...aplatir(n.sous_groupes || [], profondeur + 1)]);

/**
 * Groupes emboîtés : promotion ⊃ groupes de TD ⊃ demi-groupes de TP. Un étudiant est inscrit
 * dans son groupe le plus fin ; il suit aussi les séances de ses groupes parents.
 */
export default function Groupes() {
    const { t } = useTranslation();
    const toast = useToast();
    const [filieres, setFilieres] = useState([]);
    const [filiere, setFiliere] = useState('');
    const [annees, setAnnees] = useState(() => [anneeScolaireCourante()]);
    const [anneeScolaire, setAnneeScolaire] = useState(anneeScolaireCourante());
    const [arbre, setArbre] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialog, setDialog] = useState({ open: false, editing: null, form: GROUPE_VIDE });
    const [aSupprimer, setASupprimer] = useState(null);
    const [importOuvert, setImportOuvert] = useState(false);

    // Filières et années scolaires disponibles
    useEffect(() => {
        (async () => {
            try {
                const [listeFilieres, groupes] = await Promise.all([fetchAll(filiereAPI.getAll), fetchAll(groupeAPI.getAll)]);
                setFilieres(listeFilieres);
                setFiliere((f) => f || listeFilieres[0]?.id_filiere || '');
                const liste = [...new Set([anneeScolaireCourante(), ...groupes.map((g) => g.annee_scolaire)])].sort().reverse();
                setAnnees(liste);
            } catch {
                toast.error(t('common.errorLoad'));
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const chargerArbre = useCallback(async () => {
        if (!filiere) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            setArbre(await groupeAPI.getArbre({ id_filiere: filiere, annee_scolaire: anneeScolaire }));
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setLoading(false);
        }
    }, [filiere, anneeScolaire, t, toast]);

    useEffect(() => {
        chargerArbre();
    }, [chargerArbre]);

    const lignes = useMemo(() => aplatir(arbre), [arbre]);
    const erreur = (error) => toast.error(error.response?.data?.error || error.response?.data?.errors?.[0]?.message || error.message);

    const ouvrir = ({ groupe = null, parent = null } = {}) => {
        if (groupe) {
            setDialog({ open: true, editing: groupe, form: { ...GROUPE_VIDE, ...groupe, annee: groupe.annee ?? '' } });
            return;
        }
        setDialog({
            open: true,
            editing: null,
            form: parent
                ? {
                      ...GROUPE_VIDE,
                      id_filiere: parent.id_filiere,
                      niveau: parent.niveau,
                      annee: parent.annee ?? '',
                      annee_scolaire: parent.annee_scolaire,
                      type_groupe: ENFANT_DE[parent.type_groupe],
                      id_groupe_parent: parent.id_groupe,
                      nom_groupe: `${parent.nom_groupe}-`,
                  }
                : { ...GROUPE_VIDE, id_filiere: filiere, annee_scolaire: anneeScolaire },
        });
    };

    const champ = (nom) => (e) => setDialog((d) => ({ ...d, form: { ...d.form, [nom]: e.target.value } }));

    const enregistrer = async (event) => {
        event.preventDefault();
        const f = dialog.form;
        const data = {
            nom_groupe: f.nom_groupe.trim(),
            niveau: f.niveau.trim(),
            effectif: Number(f.effectif) || 0,
            annee_scolaire: f.annee_scolaire.trim(),
            id_filiere: Number(f.id_filiere),
            type_groupe: f.type_groupe,
            id_groupe_parent: f.id_groupe_parent || null,
            annee: f.annee === '' ? null : Number(f.annee),
        };
        try {
            if (dialog.editing) await groupeAPI.update(dialog.editing.id_groupe, data);
            else await groupeAPI.create(data);
            toast.success(t('ref.groups.saved'));
            setDialog({ open: false, editing: null, form: GROUPE_VIDE });
            chargerArbre();
        } catch (error) {
            erreur(error);
        }
    };

    const supprimer = async () => {
        const groupe = aSupprimer;
        setASupprimer(null);
        try {
            await groupeAPI.delete(groupe.id_groupe);
            toast.success(t('ref.groups.deleted'));
            chargerArbre();
        } catch (error) {
            erreur(error);
        }
    };

    // Import : les parents doivent précéder leurs sous-groupes dans le fichier
    const importer = async (lignesFichier) => {
        const parCode = new Map(filieres.map((f) => [f.code_filiere.toLowerCase(), f.id_filiere]));
        const crees = new Map();
        const erreurs = [];
        let reussies = 0;
        for (const [index, ligne] of lignesFichier.entries()) {
            try {
                const idFiliere = parCode.get(String(ligne.code_filiere || '').trim().toLowerCase());
                if (!idFiliere) throw new Error(t('ref.curriculum.unknownProgram', { code: ligne.code_filiere || '' }));
                const nomParent = String(ligne.parent || '').trim();
                const idParent = nomParent ? crees.get(nomParent) : null;
                if (nomParent && !idParent) throw new Error(t('ref.groups.parentNotFound', { name: nomParent }));
                const reponse = await groupeAPI.create({
                    nom_groupe: String(ligne.nom_groupe || '').trim(),
                    id_filiere: idFiliere,
                    niveau: String(ligne.niveau || '').trim(),
                    annee: ligne.annee ? Number(ligne.annee) : null,
                    effectif: Number(ligne.effectif) || 0,
                    annee_scolaire: String(ligne.annee_scolaire || anneeScolaire).trim(),
                    type_groupe: String(ligne.type_groupe || 'td').trim().toLowerCase(),
                    id_groupe_parent: idParent,
                });
                crees.set(reponse.groupe.nom_groupe, reponse.groupe.id_groupe);
                reussies += 1;
            } catch (error) {
                erreurs.push({
                    ligne: index + 2,
                    libelle: ligne.nom_groupe,
                    message: error.response?.data?.error || error.response?.data?.errors?.[0]?.message || error.message,
                });
            }
        }
        if (reussies) chargerArbre();
        return { reussies, erreurs };
    };

    // Effectif d'un groupe face à la somme de ses sous-groupes : signale l'écart, sans bloquer
    const ecartEffectif = (groupe) => {
        if (!groupe.sous_groupes?.length) return null;
        const somme = groupe.sous_groupes.reduce((total, g) => total + (Number(g.effectif) || 0), 0);
        return somme === Number(groupe.effectif) ? null : somme;
    };

    const filiereCourante = filieres.find((f) => f.id_filiere === filiere);

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <TextField select size="small" label={t('ref.curriculum.program')} value={filiere} onChange={(e) => setFiliere(e.target.value)} sx={{ minWidth: 240 }}>
                            {filieres.map((f) => (
                                <MenuItem key={f.id_filiere} value={f.id_filiere}>
                                    {f.code_filiere} · {f.nom_filiere}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField select size="small" label={t('ref.groups.schoolYear')} value={anneeScolaire} onChange={(e) => setAnneeScolaire(e.target.value)} sx={{ minWidth: 150 }}>
                            {annees.map((a) => (
                                <MenuItem key={a} value={a}>
                                    {a}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button variant="outlined" onClick={async () => exportToExcelLazy(await fetchAll(groupeAPI.getAll, { id_filiere: filiere }), COLS_GROUPES, 'Groupes', 'Groupes')}>
                            {t('ref.import.export')}
                        </Button>
                        <Button variant="outlined" startIcon={<UploadFile />} onClick={() => setImportOuvert(true)}>
                            {t('ref.import.button')}
                        </Button>
                        <Button variant="contained" startIcon={<Add />} onClick={() => ouvrir()} disabled={!filiere}>
                            {t('ref.groups.addPromotion')}
                        </Button>
                    </Stack>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 760 }}>
                    {t('ref.groups.intro')}
                </Typography>

                {loading ? (
                    <TableSkeleton rows={6} />
                ) : lignes.length === 0 ? (
                    <EmptyState
                        title={t('ref.groups.emptyTitle', { program: filiereCourante?.code_filiere || '', year: anneeScolaire })}
                        description={t('ref.groups.emptyBody')}
                        actionLabel={t('ref.groups.addPromotion')}
                        onAction={() => ouvrir()}
                    />
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{t('ref.groups.cols.group')}</TableCell>
                                    <TableCell>{t('ref.groups.cols.type')}</TableCell>
                                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.groups.cols.level')}</TableCell>
                                    <TableCell align="right">{t('ref.groups.cols.size')}</TableCell>
                                    <TableCell align="right">{t('ref.rooms.cols.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {lignes.map((groupe) => {
                                    const somme = ecartEffectif(groupe);
                                    const typeEnfant = ENFANT_DE[groupe.type_groupe];
                                    return (
                                        <TableRow key={groupe.id_groupe} hover>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: groupe.profondeur * 3 }}>
                                                    {groupe.profondeur > 0 ? (
                                                        <SubdirectoryArrowRight fontSize="small" sx={{ color: 'text.disabled' }} aria-hidden />
                                                    ) : (
                                                        <Box component="span" aria-hidden sx={{ width: 9, height: 9, borderRadius: '2px', bgcolor: lineColor(groupe.id_filiere) }} />
                                                    )}
                                                    <Typography variant="body2" sx={{ fontWeight: groupe.profondeur === 0 ? 700 : 600, fontFamily: groupe.profondeur === 0 ? ds.font.board : undefined, letterSpacing: groupe.profondeur === 0 ? '0.04em' : undefined }}>
                                                        {groupe.nom_groupe}
                                                    </Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>{t(`ref.groupTypes.${groupe.type_groupe}`)}</TableCell>
                                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{groupe.niveau}</TableCell>
                                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                {somme !== null && (
                                                    <Tooltip title={t('ref.groups.sizeGap', { sum: somme })}>
                                                        <Box component="span" sx={{ mr: 1 }}>
                                                            <StateChip tone="warning">{t('ref.groups.gap')}</StateChip>
                                                        </Box>
                                                    </Tooltip>
                                                )}
                                                {groupe.effectif}
                                            </TableCell>
                                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                {typeEnfant && (
                                                    <Button
                                                        size="small"
                                                        startIcon={<Add />}
                                                        onClick={() => ouvrir({ parent: groupe })}
                                                        aria-label={t('ref.groups.addChild', { type: t(`ref.groupTypes.${typeEnfant}`), name: groupe.nom_groupe })}
                                                        sx={{ mr: 0.5 }}
                                                    >
                                                        {t(`ref.groups.add.${typeEnfant}`)}
                                                    </Button>
                                                )}
                                                <IconButton size="small" onClick={() => ouvrir({ groupe })} aria-label={t('ref.common.editItem', { name: groupe.nom_groupe })}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => setASupprimer(groupe)} aria-label={t('ref.common.deleteItem', { name: groupe.nom_groupe })}>
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

            <Dialog open={dialog.open} onClose={() => setDialog({ open: false, editing: null, form: GROUPE_VIDE })} maxWidth="sm" fullWidth>
                <form onSubmit={enregistrer}>
                    <DialogTitle>
                        {dialog.editing ? t('ref.groups.edit') : t(`ref.groups.create.${dialog.form.type_groupe}`)}
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField label={t('ref.groups.fields.name')} value={dialog.form.nom_groupe} onChange={champ('nom_groupe')} helperText={t('ref.groups.fields.nameHelp')} required autoFocus />
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField fullWidth label={t('ref.groups.fields.level')} value={dialog.form.niveau} onChange={champ('niveau')} placeholder="4ème année" required />
                                <TextField type="number" label={t('ref.groups.fields.year')} value={dialog.form.annee} onChange={champ('annee')} inputProps={{ min: 1, max: 6 }} sx={{ minWidth: 130 }} />
                                <TextField type="number" label={t('ref.groups.fields.size')} value={dialog.form.effectif} onChange={champ('effectif')} inputProps={{ min: 0 }} sx={{ minWidth: 120 }} />
                            </Stack>
                            <TextField label={t('ref.groups.fields.schoolYear')} value={dialog.form.annee_scolaire} onChange={champ('annee_scolaire')} placeholder="2026-2027" required />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialog({ open: false, editing: null, form: GROUPE_VIDE })}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained">
                            {t('common.save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <ImportCsvDialog
                open={importOuvert}
                onClose={() => setImportOuvert(false)}
                titre={t('ref.groups.importTitle')}
                intro={t('ref.groups.importIntro')}
                modele={MODELE_CSV}
                nomModele="modele-groupes.csv"
                onImport={importer}
            />

            <ConfirmDialog
                open={Boolean(aSupprimer)}
                title={t('ref.groups.deleteTitle')}
                message={t('ref.groups.deleteBody', { name: aSupprimer?.nom_groupe })}
                onConfirm={supprimer}
                onCancel={() => setASupprimer(null)}
            />
        </DashboardLayout>
    );
}
