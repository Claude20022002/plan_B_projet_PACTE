import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Paper, TablePagination, Button, Alert, Snackbar, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { affectationAPI, coursAPI, groupeAPI, salleAPI, creneauAPI, enseignantAPI, imprevuAPI } from '../../services/api';
import { exporterToutesLesSeances } from '../../utils/exportSeances';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirmation } from '../../contexts/ConfirmationContext';
import { useTranslation } from 'react-i18next';
import ViolationsDialog from '../../components/planning/ViolationsDialog';
import AssistantCreneauxDialog from '../../components/planning/AssistantCreneauxDialog';
import { useFormik } from 'formik';
import DataToolbar from '../../design-system/components/DataToolbar';
import EmptyState from '../../design-system/components/EmptyState';
import StatusBadge from '../../design-system/components/StatusBadge';
import { TableSkeleton } from '../../design-system/components/PremiumSkeleton';
import ListeSeances from '../../components/affectations/ListeSeances';
import SeanceDialog from '../../components/affectations/SeanceDialog';
import { valeursVides, validationSchema } from '../../components/affectations/formulaire';
import OngletsEmploisDuTemps from '../../components/gestion/OngletsEmploisDuTemps';

export default function Affectations() {
    const confirmer = useConfirmation();
    const { user } = useAuth();
    const { t } = useTranslation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [searchParams, setSearchParams] = useSearchParams();
    const [affectations, setAffectations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [violations, setViolations] = useState(null);
    const [aDeplacer, setADeplacer] = useState(null);
    const [options, setOptions] = useState({
        cours: [],
        groupes: [],
        salles: [],
        creneaux: [],
        enseignants: [],
    });

    useEffect(() => {
        loadOptions();
        loadAffectations();
    }, [page, rowsPerPage]);

    const loadOptions = async () => {
        try {
            const [cours, groupes, salles, creneaux, enseignants] = await Promise.all([
                coursAPI.getTous(),
                groupeAPI.getTous(),
                salleAPI.getTous(),
                creneauAPI.getTous(),
                enseignantAPI.getTous(),
            ]);

            setOptions({
                cours: cours.data || cours || [],
                groupes: groupes.data || groupes || [],
                salles: salles.data || salles || [],
                creneaux: creneaux.data || creneaux || [],
                enseignants: enseignants.data || enseignants || [],
            });
        } catch (error) {
            console.error('Erreur lors du chargement des options:', error);
            setError('Erreur lors du chargement des données');
        }
    };

    const loadAffectations = async () => {
        setLoading(true);
        try {
            const data = await affectationAPI.getAll({
                page: page + 1,
                limit: rowsPerPage,
            });
            setAffectations(data.data || []);
            setTotal(data.pagination?.total || 0);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const formik = useFormik({
        initialValues: valeursVides(user),
        validationSchema,
        enableReinitialize: true,
        onSubmit: async (values, { setSubmitting }) => {
            try {
                setError('');
                setSuccess('');
                
                // Validation manuelle des champs requis
                if (!values.id_cours || !values.id_groupe || !values.id_user_enseignant || 
                    !values.id_salle || !values.id_creneau || !values.date_seance) {
                    setError('Veuillez remplir tous les champs requis');
                    setSubmitting(false);
                    return;
                }
                
                // Convertir les valeurs string en nombres pour les IDs
                const dataToSend = {
                    date_seance: values.date_seance,
                    statut: values.statut || 'planifie',
                    commentaire: values.commentaire || '',
                    id_cours: Number(values.id_cours),
                    id_groupe: Number(values.id_groupe),
                    id_user_enseignant: Number(values.id_user_enseignant),
                    id_salle: Number(values.id_salle),
                    id_creneau: Number(values.id_creneau),
                    id_user_admin: user?.id_user || Number(values.id_user_admin),
                };

                // Les règles de planification sont vérifiées par le serveur : 409 + liste si l'une bloque,
                // et l'administration peut alors forcer en justifiant (ViolationsDialog)
                const envoyer = (extra = {}) =>
                    editing ? affectationAPI.update(editing.id_affectation, { ...dataToSend, ...extra }) : affectationAPI.create({ ...dataToSend, ...extra });
                const apresEnregistrement = async (reponse) => {
                    const avertissements = (reponse.violations || []).filter((v) => !v.bloquant).length;
                    const base = reponse.force ? t('rules.forced') : editing ? 'Séance modifiée avec succès' : 'Séance planifiée avec succès';
                    setSuccess(avertissements ? `${base} · ${t('rules.warningsCount', { count: avertissements })}` : base);
                    setViolations(null);
                    formik.resetForm();
                    setOpen(false);
                    setEditing(null);
                    setSearchParams({}); // Nettoyer les paramètres URL
                    await loadAffectations();
                };
                try {
                    await apresEnregistrement(await envoyer());
                } catch (erreurEnvoi) {
                    if (erreurEnvoi.status === 409 && erreurEnvoi.response?.data?.violations) {
                        setViolations({
                            liste: erreurEnvoi.response.data.violations,
                            forcer: async (justification) => {
                                try {
                                    await apresEnregistrement(await envoyer({ forcer: true, justification }));
                                } catch (erreurForcage) {
                                    setError(erreurForcage.response?.data?.error || erreurForcage.message);
                                }
                            },
                        });
                        return;
                    }
                    throw erreurEnvoi;
                }
            } catch (error) {
                console.error('Erreur lors de la sauvegarde:', error);
                
                // Extraire le message d'erreur de manière plus robuste
                let errorMessage = 'Erreur lors de la sauvegarde de l\'affectation';
                
                if (error.message) {
                    errorMessage = error.message;
                } else if (error.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response?.data?.error) {
                    errorMessage = error.response.data.error;
                } else if (typeof error.response?.data === 'string') {
                    errorMessage = error.response.data;
                }
                
                setError(errorMessage);
                
                // Ne pas rediriger automatiquement - laisser l'utilisateur voir l'erreur
                // Le dialog reste ouvert pour qu'il puisse corriger les erreurs
            } finally {
                setSubmitting(false);
            }
        },
    });

    const handleEdit = (affectation) => {
        setEditing(affectation);
        formik.setValues({
            date_seance: affectation.date_seance,
            statut: affectation.statut,
            commentaire: affectation.commentaire || '',
            id_cours: affectation.id_cours,
            id_groupe: affectation.id_groupe,
            id_user_enseignant: affectation.id_user_enseignant,
            id_salle: affectation.id_salle,
            id_creneau: affectation.id_creneau,
            id_user_admin: user?.id_user || '',
        });
        setOpen(true);
    };

    const handleOpenNewDialog = () => {
        setEditing(null);
        setError('');
        setSuccess('');
        formik.resetForm({ values: valeursVides(user) });
        setOpen(true);
    };

    // Ouvrir automatiquement le dialog si le paramètre "nouvelle" est présent dans l'URL
    useEffect(() => {
        if (searchParams.get('nouvelle') === 'true') {
            handleOpenNewDialog();
            // Retirer le paramètre de l'URL
            setSearchParams({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const handleExport = async () => {
        try {
            await exporterToutesLesSeances();
        } catch { setError('Erreur lors de l\'export'); }
    };

    const handleDelete = async (id) => {
        if (!(await confirmer('Êtes-vous sûr de vouloir supprimer cette affectation ?'))) return;
        try {
            await affectationAPI.delete(id);
            loadAffectations();
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const filteredAffectations = affectations.filter((aff) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return [
            aff.cours?.nom_cours,
            aff.groupe?.nom_groupe,
            aff.enseignant?.prenom,
            aff.enseignant?.nom,
            aff.salle?.nom_salle,
            aff.statut,
        ].filter(Boolean).join(' ').toLowerCase().includes(q);
    });

    return (
        <DashboardLayout>
            <OngletsEmploisDuTemps />
            <Box>
                <Snackbar
                    open={!!error}
                    autoHideDuration={6000}
                    onClose={() => setError('')}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
                        {error}
                    </Alert>
                </Snackbar>

                <Snackbar
                    open={!!success}
                    autoHideDuration={4000}
                    onClose={() => setSuccess('')}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
                        {success}
                    </Alert>
                </Snackbar>

                <Paper sx={{ p: { xs: 1.5, md: 2 }, border: '1px solid', borderColor: 'divider' }}>
                    <DataToolbar search={search} onSearchChange={setSearch} onExport={handleExport}>
                        <Button variant="contained" startIcon={<Add />} onClick={handleOpenNewDialog}>
                            Planifier une séance
                        </Button>
                    </DataToolbar>

                    {loading ? (
                        <TableSkeleton rows={8} />
                    ) : filteredAffectations.length === 0 ? (
                        <EmptyState
                            title="Aucune affectation trouvée"
                            description="Créez une première affectation ou ajustez votre recherche pour retrouver un cours planifié."
                            actionLabel="Nouvelle affectation"
                            onAction={handleOpenNewDialog}
                        />
                    ) : (
                        <ListeSeances affectations={filteredAffectations} mobile={isMobile} onDeplacer={setADeplacer} onModifier={handleEdit} onSupprimer={handleDelete} />
                    )}

                    <TablePagination
                        component="div"
                        count={total}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                    />
                </Paper>

                <SeanceDialog open={open} editing={editing} formik={formik} options={options} onClose={() => setOpen(false)} />
            </Box>
            <ViolationsDialog violations={violations?.liste} onClose={() => setViolations(null)} onForcer={violations?.forcer} />
            {/* Assistant de créneaux (I8) : déplacer une séance sur un créneau déjà vérifié */}
            <AssistantCreneauxDialog
                open={Boolean(aDeplacer)}
                titre={t('incidents.findSlot')}
                sousTitre={aDeplacer ? `${aDeplacer.cours?.nom_cours ?? ''} · ${aDeplacer.groupe?.nom_groupe ?? ''}` : ''}
                onClose={() => setADeplacer(null)}
                chercher={(date_debut, date_fin) => imprevuAPI.creneauxSeance({ id_affectation: aDeplacer.id_affectation, date_debut, date_fin })}
                onChoisir={async (p) => {
                    try {
                        await affectationAPI.update(aDeplacer.id_affectation, { date_seance: p.date, id_creneau: p.id_creneau, id_salle: p.id_salle });
                        setSuccess(t('incidents.moved'));
                        setADeplacer(null);
                        await loadAffectations();
                    } catch (erreurDeplacement) {
                        setError(erreurDeplacement.response?.data?.error || erreurDeplacement.message);
                    }
                }}
                libelleChoix={t('incidents.moveHere')}
            />
        </DashboardLayout>
    );
}

