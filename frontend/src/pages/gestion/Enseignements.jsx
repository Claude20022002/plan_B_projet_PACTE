import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    Checkbox,
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
    Typography,
} from '@mui/material';
import { AutoAwesome, CallSplit, Delete, Edit, MergeType } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../design-system/components/EmptyState';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { calendrierAPI, enseignementAPI, filiereAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { fetchAll } from '../../utils/fetchAll';
import { ds, lineColor } from '../../design-system/tokens';

/**
 * Enseignements d'une période : ce qui sera réellement planifié (une composante de module,
 * suivie par un ou plusieurs groupes). Générés depuis la maquette, puis mutualisés
 * (un même cours pour plusieurs groupes) ou découpés par le responsable.
 */
export default function Enseignements() {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const [periodes, setPeriodes] = useState([]);
    const [idPeriode, setIdPeriode] = useState('');
    const [filieres, setFilieres] = useState([]);
    const [filiere, setFiliere] = useState('toutes');
    const [enseignements, setEnseignements] = useState([]);
    const [selection, setSelection] = useState(() => new Set());
    const [loading, setLoading] = useState(true);
    const [rapport, setRapport] = useState(null);
    const [edition, setEdition] = useState(null);
    const [aSupprimer, setASupprimer] = useState(null);

    const nombre = useMemo(() => new Intl.NumberFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { maximumFractionDigits: 1 }), [i18n.language]);

    useEffect(() => {
        (async () => {
            try {
                const [annees, listeFilieres] = await Promise.all([calendrierAPI.getAnnees(), fetchAll(filiereAPI.getAll)]);
                const liste = annees.flatMap((a) => a.periodes.map((p) => ({ ...p, libelle_annee: a.libelle, active: a.active })));
                setPeriodes(liste);
                setFilieres(listeFilieres);
                const parDefaut = liste.find((p) => p.active && p.date_debut <= new Date().toISOString().slice(0, 10) && p.date_fin >= new Date().toISOString().slice(0, 10)) || liste.find((p) => p.active) || liste[0];
                setIdPeriode(parDefaut?.id_periode ?? '');
                if (!parDefaut) setLoading(false);
            } catch {
                toast.error(t('common.errorLoad'));
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const charger = useCallback(async () => {
        if (!idPeriode) return;
        setLoading(true);
        try {
            const params = { id_periode: idPeriode };
            if (filiere !== 'toutes') params.id_filiere = filiere;
            setEnseignements(await enseignementAPI.getAll(params));
            setSelection(new Set());
        } catch {
            toast.error(t('common.errorLoad'));
        } finally {
            setLoading(false);
        }
    }, [idPeriode, filiere, t, toast]);

    useEffect(() => {
        charger();
    }, [charger]);

    const erreur = (error) => toast.error(error.response?.data?.error || error.response?.data?.errors?.[0]?.message || error.message);

    const generer = async () => {
        try {
            const resultat = await enseignementAPI.generer({ id_periode: idPeriode, ...(filiere !== 'toutes' && { id_filiere: filiere }) });
            setRapport(resultat);
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    const basculer = (id) =>
        setSelection((s) => {
            const suivant = new Set(s);
            if (suivant.has(id)) suivant.delete(id);
            else suivant.add(id);
            return suivant;
        });

    const mutualiser = async () => {
        try {
            await enseignementAPI.fusionner([...selection]);
            toast.success(t('ref.teaching.merged'));
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    const scinder = async (enseignement) => {
        try {
            await enseignementAPI.scinder(enseignement.id_enseignement);
            toast.success(t('ref.teaching.split'));
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    const enregistrerEdition = async (event) => {
        event.preventDefault();
        try {
            await enseignementAPI.update(edition.id_enseignement, { heures_prevues: Number(edition.heures_prevues), libelle: edition.libelle || null });
            toast.success(t('ref.teaching.saved'));
            setEdition(null);
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    const supprimer = async () => {
        const enseignement = aSupprimer;
        setASupprimer(null);
        try {
            await enseignementAPI.delete(enseignement.id_enseignement);
            toast.success(t('ref.teaching.deleted'));
            charger();
        } catch (error) {
            erreur(error);
        }
    };

    const tries = useMemo(
        () =>
            [...enseignements].sort(
                (a, b) =>
                    (a.composante.cours.filiere?.code_filiere || '').localeCompare(b.composante.cours.filiere?.code_filiere || '') ||
                    a.composante.cours.nom_cours.localeCompare(b.composante.cours.nom_cours, 'fr') ||
                    a.composante.type.localeCompare(b.composante.type)
            ),
        [enseignements]
    );

    if (!loading && periodes.length === 0) {
        return (
            <DashboardLayout>
                <EmptyState title={t('ref.teaching.noPeriodTitle')} description={t('ref.teaching.noPeriodBody')} />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                        <TextField select size="small" label={t('ref.teaching.period')} value={idPeriode} onChange={(e) => setIdPeriode(e.target.value)} sx={{ minWidth: 200 }}>
                            {periodes.map((p) => (
                                <MenuItem key={p.id_periode} value={p.id_periode}>
                                    {p.libelle_annee} · {p.code}
                                </MenuItem>
                            ))}
                        </TextField>
                        <TextField select size="small" label={t('ref.curriculum.program')} value={filiere} onChange={(e) => setFiliere(e.target.value)} sx={{ minWidth: 220 }}>
                            <MenuItem value="toutes">{t('ref.curriculum.allPrograms')}</MenuItem>
                            {filieres.map((f) => (
                                <MenuItem key={f.id_filiere} value={f.id_filiere}>
                                    {f.code_filiere} · {f.nom_filiere}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Stack>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button variant="outlined" startIcon={<MergeType />} onClick={mutualiser} disabled={selection.size < 2}>
                            {t('ref.teaching.merge', { count: selection.size })}
                        </Button>
                        <Button variant="contained" startIcon={<AutoAwesome />} onClick={generer} disabled={!idPeriode}>
                            {t('ref.teaching.generate')}
                        </Button>
                    </Stack>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 820 }}>
                    {t('ref.teaching.intro')}
                </Typography>

                {rapport && (
                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5, mb: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {t('ref.teaching.report', { created: rapport.crees, attached: rapport.rattaches ?? 0, existing: rapport.existants, year: rapport.annee_scolaire })}
                        </Typography>
                        {rapport.sans_groupe.length > 0 && (
                            <>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                    {t('ref.teaching.withoutGroup', { count: rapport.sans_groupe.length })}
                                </Typography>
                                <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 3 }}>
                                    {rapport.sans_groupe.map((s) => (
                                        <Typography component="li" variant="body2" key={`${s.id_cours}-${s.type}`}>
                                            {s.code_cours} · {s.nom_cours} · {s.type} → {t(`ref.groupTypes.${s.niveau_groupe}`)}
                                        </Typography>
                                    ))}
                                </Box>
                            </>
                        )}
                        <Button size="small" onClick={() => setRapport(null)} sx={{ mt: 1 }}>
                            {t('common.close')}
                        </Button>
                    </Box>
                )}

                {loading ? (
                    <TableSkeleton rows={8} />
                ) : tries.length === 0 ? (
                    <EmptyState title={t('ref.teaching.emptyTitle')} description={t('ref.teaching.emptyBody')} actionLabel={t('ref.teaching.generate')} onAction={generer} />
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox" />
                                    <TableCell>{t('ref.teaching.cols.module')}</TableCell>
                                    <TableCell>{t('ref.teaching.cols.type')}</TableCell>
                                    <TableCell>{t('ref.teaching.cols.groups')}</TableCell>
                                    <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.teaching.cols.size')}</TableCell>
                                    <TableCell align="right">{t('ref.teaching.cols.hours')}</TableCell>
                                    <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>{t('ref.teaching.cols.sessions')}</TableCell>
                                    <TableCell align="right">{t('ref.rooms.cols.actions')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {tries.map((e) => {
                                    const module = e.composante.cours;
                                    const mutualise = e.groupes.length > 1;
                                    return (
                                        <TableRow key={e.id_enseignement} hover selected={selection.has(e.id_enseignement)}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    size="small"
                                                    checked={selection.has(e.id_enseignement)}
                                                    onChange={() => basculer(e.id_enseignement)}
                                                    inputProps={{ 'aria-label': t('ref.teaching.select', { name: `${module.nom_cours} ${e.composante.type}` }) }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Box component="span" aria-hidden sx={{ width: 9, height: 9, borderRadius: '2px', flexShrink: 0, bgcolor: lineColor(module.id_filiere) }} />
                                                    <Box sx={{ minWidth: 0 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {e.libelle || module.nom_cours}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {module.code_cours} · {module.semestre}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.75} alignItems="center">
                                                    <Typography component="span" sx={{ fontFamily: ds.font.board, fontWeight: 600 }}>
                                                        {e.composante.type}
                                                    </Typography>
                                                    {e.composante.modalite !== 'presentiel' && <StateChip tone="info">{t(`ref.modes.${e.composante.modalite}`)}</StateChip>}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                                                    {mutualise && <StateChip tone="info">{t('ref.teaching.shared')}</StateChip>}
                                                    <Typography variant="body2">{e.groupes.map((g) => g.nom_groupe).join(', ')}</Typography>
                                                </Stack>
                                            </TableCell>
                                            <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>{e.effectif}</TableCell>
                                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{nombre.format(e.heures_prevues)} h</TableCell>
                                            <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>{e.nb_seances}</TableCell>
                                            <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                                                {mutualise && (
                                                    <IconButton size="small" onClick={() => scinder(e)} aria-label={t('ref.teaching.splitItem', { name: module.nom_cours })}>
                                                        <CallSplit fontSize="small" />
                                                    </IconButton>
                                                )}
                                                <IconButton size="small" onClick={() => setEdition({ id_enseignement: e.id_enseignement, heures_prevues: e.heures_prevues, libelle: e.libelle || '', nom: module.nom_cours })} aria-label={t('ref.common.editItem', { name: module.nom_cours })}>
                                                    <Edit fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => setASupprimer(e)} aria-label={t('ref.common.deleteItem', { name: module.nom_cours })}>
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

            <Dialog open={Boolean(edition)} onClose={() => setEdition(null)} maxWidth="xs" fullWidth>
                <form onSubmit={enregistrerEdition}>
                    <DialogTitle>
                        {t('ref.teaching.edit')}
                        <Typography variant="body2" color="text.secondary">
                            {edition?.nom}
                        </Typography>
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <TextField type="number" label={t('ref.teaching.fields.hours')} value={edition?.heures_prevues ?? ''} onChange={(e) => setEdition((x) => ({ ...x, heures_prevues: e.target.value }))} inputProps={{ min: 0.5, step: 0.5 }} required autoFocus />
                            <TextField label={t('ref.teaching.fields.label')} value={edition?.libelle ?? ''} onChange={(e) => setEdition((x) => ({ ...x, libelle: e.target.value }))} helperText={t('ref.teaching.fields.labelHelp')} />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEdition(null)}>{t('common.cancel')}</Button>
                        <Button type="submit" variant="contained">
                            {t('common.save')}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>

            <ConfirmDialog
                open={Boolean(aSupprimer)}
                title={t('ref.teaching.deleteTitle')}
                message={t('ref.teaching.deleteBody', { name: aSupprimer?.composante?.cours?.nom_cours, type: aSupprimer?.composante?.type })}
                onConfirm={supprimer}
                onCancel={() => setASupprimer(null)}
            />
        </DashboardLayout>
    );
}
