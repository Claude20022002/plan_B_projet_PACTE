import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Box,
    Button,
    IconButton,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { Add, Delete, Edit, EventAvailable, Flag } from '@mui/icons-material';
import AnneeDialog from '../../components/calendrier/AnneeDialog';
import PeriodeDialog from '../../components/calendrier/PeriodeDialog';
import EvenementDialog from '../../components/calendrier/EvenementDialog';
import ConfirmationDialog from '../../components/calendrier/ConfirmationDialog';
import { ANNEE_VIDE, EVENEMENT_VIDE, PERIODE_VIDE, hhmm } from '../../components/calendrier/constantes';
import SectionSemestres from '../../components/calendrier/SectionSemestres';
import SectionEvenements from '../../components/calendrier/SectionEvenements';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../design-system/components/EmptyState';
import StateChip from '../../design-system/components/StateChip';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import { calendrierAPI, campusAPI, evenementAPI, filiereAPI, groupeAPI } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

export default function Calendrier() {
    const { t, i18n } = useTranslation();
    const toast = useToast();
    const [annees, setAnnees] = useState([]);
    const [idAnnee, setIdAnnee] = useState(null);
    const [evenements, setEvenements] = useState([]);
    const [aConfirmerSeulement, setAConfirmerSeulement] = useState(false);
    const [loading, setLoading] = useState(true);
    const [cibles, setCibles] = useState({ campus: [], filieres: [], groupes: [] });
    const [anneeDialog, setAnneeDialog] = useState({ open: false, editing: null, form: ANNEE_VIDE });
    const [periodeDialog, setPeriodeDialog] = useState({ open: false, editing: null, form: PERIODE_VIDE });
    const [evenementDialog, setEvenementDialog] = useState({ open: false, editing: null, form: EVENEMENT_VIDE });
    const [confirmation, setConfirmation] = useState({ open: false, evenement: null, date_debut: '', date_fin: '' });
    const [aSupprimer, setASupprimer] = useState(null);

    const annee = useMemo(() => annees.find((a) => a.id_annee === idAnnee) || null, [annees, idAnnee]);

    const formatDate = useCallback(
        (date) =>
            new Intl.DateTimeFormat(i18n.language === 'en' ? 'en-GB' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(
                new Date(`${date}T12:00:00`)
            ),
        [i18n.language]
    );
    const plage = (debut, fin) => (debut === fin ? formatDate(debut) : `${formatDate(debut)} → ${formatDate(fin)}`);

    const chargerAnnees = useCallback(async () => {
        const liste = await calendrierAPI.getAnnees();
        setAnnees(liste);
        setIdAnnee((courant) => (liste.some((a) => a.id_annee === courant) ? courant : (liste.find((a) => a.active) || liste[0])?.id_annee ?? null));
        return liste;
    }, []);

    const chargerEvenements = useCallback(async () => {
        if (!annee) {
            setEvenements([]);
            return;
        }
        const liste = await evenementAPI.getAll({ date_from: annee.date_debut, date_to: annee.date_fin });
        setEvenements(liste);
    }, [annee]);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                await chargerAnnees();
                const [campus, filieres, groupes] = await Promise.all([
                    campusAPI.getAll(),
                    filiereAPI.getTous(),
                    groupeAPI.getTous(),
                ]);
                setCibles({ campus: campus || [], filieres: filieres.data || filieres || [], groupes: groupes.data || groupes || [] });
            } catch {
                toast.error(t('common.errorLoad'));
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        chargerEvenements().catch(() => toast.error(t('common.errorLoad')));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chargerEvenements]);

    const erreur = (error) => toast.error(error.response?.data?.error || error.response?.data?.errors?.[0]?.message || error.message);

    // ── Années ────────────────────────────────────────────────────────────
    const enregistrerAnnee = async (event) => {
        event.preventDefault();
        try {
            if (anneeDialog.editing) {
                await calendrierAPI.updateAnnee(anneeDialog.editing.id_annee, anneeDialog.form);
            } else {
                const { annee: creee } = await calendrierAPI.createAnnee(anneeDialog.form);
                setIdAnnee(creee.id_annee);
            }
            toast.success(t('ref.calendar.yearSaved'));
            setAnneeDialog({ open: false, editing: null, form: ANNEE_VIDE });
            await chargerAnnees();
        } catch (error) {
            erreur(error);
        }
    };

    const ajouterFeries = async () => {
        try {
            const resultat = await calendrierAPI.genererFeries(annee.id_annee);
            toast.success(t('ref.calendar.holidaysAdded', { count: resultat.crees, toConfirm: resultat.a_confirmer }));
            chargerEvenements();
        } catch (error) {
            erreur(error);
        }
    };

    // ── Semestres ─────────────────────────────────────────────────────────
    const enregistrerPeriode = async (event) => {
        event.preventDefault();
        const form = { ...periodeDialog.form, nb_semaines: Number(periodeDialog.form.nb_semaines), libelle: periodeDialog.form.libelle || null };
        try {
            if (periodeDialog.editing) await calendrierAPI.updatePeriode(periodeDialog.editing.id_periode, form);
            else await calendrierAPI.createPeriode(annee.id_annee, form);
            toast.success(t('ref.calendar.semesterSaved'));
            setPeriodeDialog({ open: false, editing: null, form: PERIODE_VIDE });
            await chargerAnnees();
        } catch (error) {
            erreur(error);
        }
    };

    // ── Événements ────────────────────────────────────────────────────────
    const ouvrirEvenement = (evenement = null) =>
        setEvenementDialog({
            open: true,
            editing: evenement,
            form: evenement
                ? {
                      ...EVENEMENT_VIDE,
                      ...evenement,
                      description: evenement.description || '',
                      id_cible: evenement.id_cible ?? '',
                      niveau: evenement.niveau || '',
                      heure_debut: hhmm(evenement.heure_debut),
                      heure_fin: hhmm(evenement.heure_fin),
                  }
                : { ...EVENEMENT_VIDE, date_debut: annee?.date_debut || '', date_fin: annee?.date_debut || '' },
        });

    const enregistrerEvenement = async (event) => {
        event.preventDefault();
        const { form } = evenementDialog;
        const data = {
            titre: form.titre,
            description: form.description || null,
            date_debut: form.date_debut,
            date_fin: form.date_fin,
            type_evenement: form.type_evenement,
            bloque_affectations: form.bloque_affectations,
            portee: form.portee,
            id_cible: form.portee === 'etablissement' ? null : Number(form.id_cible) || null,
            niveau: form.portee === 'niveau' ? form.niveau : null,
            heure_debut: form.heure_debut || null,
            heure_fin: form.heure_fin || null,
        };
        try {
            if (evenementDialog.editing) await evenementAPI.update(evenementDialog.editing.id_evenement, data);
            else await evenementAPI.create(data);
            toast.success(t('ref.calendar.eventSaved'));
            setEvenementDialog({ open: false, editing: null, form: EVENEMENT_VIDE });
            chargerEvenements();
        } catch (error) {
            erreur(error);
        }
    };

    const confirmer = async (event) => {
        event.preventDefault();
        try {
            const resultat = await evenementAPI.confirmer(confirmation.evenement.id_evenement, {
                date_debut: confirmation.date_debut,
                date_fin: confirmation.date_fin,
            });
            toast[resultat.decale ? 'warning' : 'success'](resultat.decale ? t('ref.calendar.shiftedMsg') : t('ref.calendar.confirmedMsg'));
            setConfirmation({ open: false, evenement: null, date_debut: '', date_fin: '' });
            chargerEvenements();
        } catch (error) {
            erreur(error);
        }
    };

    // ── Suppressions (année, semestre, événement) ─────────────────────────
    const supprimer = async () => {
        const { type, item } = aSupprimer;
        setASupprimer(null);
        try {
            if (type === 'annee') await calendrierAPI.deleteAnnee(item.id_annee);
            if (type === 'periode') await calendrierAPI.deletePeriode(item.id_periode);
            if (type === 'evenement') await evenementAPI.delete(item.id_evenement);
            toast.success(t('ref.calendar.deleted'));
            await chargerAnnees();
            chargerEvenements();
        } catch (error) {
            erreur(error);
        }
    };

    const libelleCible = (evenement) => {
        if (evenement.portee === 'etablissement') return t('ref.scopes.etablissement');
        const source = { campus: cibles.campus, filiere: cibles.filieres, niveau: cibles.filieres, groupe: cibles.groupes }[evenement.portee] || [];
        const cle = { campus: 'id_campus', filiere: 'id_filiere', niveau: 'id_filiere', groupe: 'id_groupe' }[evenement.portee];
        const cible = source.find((c) => c[cle] === evenement.id_cible);
        const nom = cible?.nom || cible?.nom_filiere || cible?.nom_groupe || `#${evenement.id_cible}`;
        return evenement.portee === 'niveau' ? `${nom} · ${evenement.niveau}` : nom;
    };

    const evenementsAffiches = aConfirmerSeulement ? evenements.filter((e) => !e.date_confirmee) : evenements;
    const nbAConfirmer = evenements.filter((e) => !e.date_confirmee).length;

    if (loading) {
        return (
            <DashboardLayout>
                <TableSkeleton rows={8} />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {annees.length === 0 ? (
                <EmptyState
                    icon={<EventAvailable />}
                    title={t('ref.calendar.noYearTitle')}
                    description={t('ref.calendar.noYearBody')}
                    actionLabel={t('ref.calendar.newYear')}
                    onAction={() => setAnneeDialog({ open: true, editing: null, form: ANNEE_VIDE })}
                />
            ) : (
                <Stack spacing={3}>
                    {/* Année universitaire */}
                    <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', justifyContent: 'space-between' }}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <TextField
                                    select
                                    size="small"
                                    label={t('ref.calendar.year')}
                                    value={idAnnee ?? ''}
                                    onChange={(e) => setIdAnnee(Number(e.target.value))}
                                    sx={{ minWidth: 180 }}
                                >
                                    {annees.map((a) => (
                                        <MenuItem key={a.id_annee} value={a.id_annee}>
                                            {a.libelle}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                {annee?.active && <StateChip tone="success">{t('ref.calendar.active')}</StateChip>}
                                {annee && (
                                    <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
                                        {plage(annee.date_debut, annee.date_fin)}
                                    </Typography>
                                )}
                            </Stack>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {annee && (
                                    <>
                                        <IconButton
                                            size="small"
                                            onClick={() => setAnneeDialog({ open: true, editing: annee, form: { libelle: annee.libelle, date_debut: annee.date_debut, date_fin: annee.date_fin, active: annee.active } })}
                                            aria-label={t('ref.common.editItem', { name: annee.libelle })}
                                        >
                                            <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => setASupprimer({ type: 'annee', item: annee })} aria-label={t('ref.common.deleteItem', { name: annee.libelle })}>
                                            <Delete fontSize="small" />
                                        </IconButton>
                                        <Button variant="outlined" startIcon={<Flag />} onClick={ajouterFeries}>
                                            {t('ref.calendar.addHolidays')}
                                        </Button>
                                    </>
                                )}
                                <Button variant="contained" startIcon={<Add />} onClick={() => setAnneeDialog({ open: true, editing: null, form: ANNEE_VIDE })}>
                                    {t('ref.calendar.newYear')}
                                </Button>
                            </Stack>
                        </Box>

                        {/* Semestres */}
                        <SectionSemestres
                            annee={annee}
                            plage={plage}
                            onAjouter={() => setPeriodeDialog({ open: true, editing: null, form: { ...PERIODE_VIDE, code: annee?.periodes?.some((p) => p.code === 'S1') ? 'S2' : 'S1' } })}
                            onModifier={(periode) => setPeriodeDialog({ open: true, editing: periode, form: { code: periode.code, libelle: periode.libelle || '', date_debut: periode.date_debut, date_fin: periode.date_fin, nb_semaines: periode.nb_semaines } })}
                            onSupprimer={(periode) => setASupprimer({ type: 'periode', item: periode })}
                        />
                    </Paper>

                    {/* Événements */}
                    <SectionEvenements
                        evenements={evenementsAffiches}
                        nbAConfirmer={nbAConfirmer}
                        aConfirmerSeulement={aConfirmerSeulement}
                        plage={plage}
                        libelleCible={libelleCible}
                        onFiltrer={setAConfirmerSeulement}
                        onAjouter={() => ouvrirEvenement()}
                        onModifier={ouvrirEvenement}
                        onSupprimer={(evenement) => setASupprimer({ type: 'evenement', item: evenement })}
                        onConfirmer={(evenement) => setConfirmation({ open: true, evenement, date_debut: evenement.date_debut, date_fin: evenement.date_fin })}
                    />
                </Stack>
            )}

            <AnneeDialog etat={anneeDialog} setEtat={setAnneeDialog} onSubmit={enregistrerAnnee} />

            <PeriodeDialog etat={periodeDialog} setEtat={setPeriodeDialog} onSubmit={enregistrerPeriode} />

            <EvenementDialog etat={evenementDialog} setEtat={setEvenementDialog} cibles={cibles} onSubmit={enregistrerEvenement} />

            <ConfirmationDialog etat={confirmation} setEtat={setConfirmation} onSubmit={confirmer} />

            <ConfirmDialog
                open={Boolean(aSupprimer)}
                title={t('ref.calendar.deleteTitle')}
                message={
                    aSupprimer?.type === 'annee'
                        ? t('ref.calendar.deleteYearBody', { name: aSupprimer.item.libelle })
                        : t('ref.calendar.deleteBody', { name: aSupprimer?.item?.titre || aSupprimer?.item?.code })
                }
                onConfirm={supprimer}
                onCancel={() => setASupprimer(null)}
            />
        </DashboardLayout>
    );
}
