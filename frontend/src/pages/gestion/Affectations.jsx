import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Button,
    IconButton,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar,
} from '@mui/material';
import { Add, Edit, Delete, Visibility, ArrowBack } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { affectationAPI, coursAPI, groupeAPI, salleAPI, creneauAPI, enseignantAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';

const validationSchema = yup.object({
    date_seance: yup.date().required('La date est requise'),
    id_cours: yup.number().required('Le cours est requis'),
    id_groupe: yup.number().required('Le groupe est requis'),
    id_user_enseignant: yup.number().required("L'enseignant est requis"),
    id_salle: yup.number().required('La salle est requise'),
    id_creneau: yup.number().required('Le créneau est requis'),
});

export default function Affectations() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [affectations, setAffectations] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
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
                coursAPI.getAll(),
                groupeAPI.getAll(),
                salleAPI.getAll(),
                creneauAPI.getAll(),
                enseignantAPI.getAll(),
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
        try {
            const data = await affectationAPI.getAll({
                page: page + 1,
                limit: rowsPerPage,
            });
            setAffectations(data.data || []);
            setTotal(data.pagination?.total || 0);
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const formik = useFormik({
        initialValues: {
            date_seance: '',
            statut: 'planifie',
            commentaire: '',
            id_cours: '',
            id_groupe: '',
            id_user_enseignant: '',
            id_salle: '',
            id_creneau: '',
            id_user_admin: user?.id_user || '',
        },
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

                if (editing) {
                    await affectationAPI.update(editing.id_affectation, dataToSend);
                    setSuccess('Affectation modifiée avec succès');
                } else {
                    await affectationAPI.create(dataToSend);
                    setSuccess('Affectation créée avec succès');
                }
                formik.resetForm();
                setOpen(false);
                setEditing(null);
                setSearchParams({}); // Nettoyer les paramètres URL
                loadAffectations();
            } catch (error) {
                console.error('Erreur:', error);
                const errorMessage = error.message || error.response?.data?.message || 'Erreur lors de la sauvegarde de l\'affectation';
                setError(errorMessage);
                
                // Si erreur 401, rediriger vers la connexion
                if (error.status === 401 || errorMessage.includes('401') || errorMessage.includes('Non autorisé')) {
                    setTimeout(() => {
                        window.location.href = '/connexion';
                    }, 2000);
                }
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
        formik.resetForm({
            values: {
                date_seance: '',
                statut: 'planifie',
                commentaire: '',
                id_cours: '',
                id_groupe: '',
                id_user_enseignant: '',
                id_salle: '',
                id_creneau: '',
                id_user_admin: user?.id_user || '',
            },
        });
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

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette affectation ?')) {
            try {
                await affectationAPI.delete(id);
                loadAffectations();
            } catch (error) {
                console.error('Erreur:', error);
            }
        }
    };

    return (
        <DashboardLayout>
            <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            startIcon={<ArrowBack />}
                            onClick={() => navigate('/dashboard/admin')}
                            variant="outlined"
                            size="small"
                        >
                            Retour
                        </Button>
                        <Typography variant="h5" fontWeight="bold">
                            Gestion des Affectations
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setEditing(null);
                            setError('');
                            setSuccess('');
                            formik.resetForm({
                                values: {
                                    date_seance: '',
                                    statut: 'planifie',
                                    commentaire: '',
                                    id_cours: '',
                                    id_groupe: '',
                                    id_user_enseignant: '',
                                    id_salle: '',
                                    id_creneau: '',
                                    id_user_admin: user?.id_user || '',
                                },
                            });
                            setOpen(true);
                        }}
                    >
                        Nouvelle affectation
                    </Button>
                </Box>

                {error && (
                    <Snackbar
                        open={!!error}
                        autoHideDuration={6000}
                        onClose={() => setError('')}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <Alert onClose={() => setError('')} severity="error">
                            {error}
                        </Alert>
                    </Snackbar>
                )}

                {success && (
                    <Snackbar
                        open={!!success}
                        autoHideDuration={6000}
                        onClose={() => setSuccess('')}
                        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    >
                        <Alert onClose={() => setSuccess('')} severity="success">
                            {success}
                        </Alert>
                    </Snackbar>
                )}

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Cours</TableCell>
                                <TableCell>Groupe</TableCell>
                                <TableCell>Enseignant</TableCell>
                                <TableCell>Salle</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Créneau</TableCell>
                                <TableCell>Statut</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {affectations.map((aff) => (
                                <TableRow key={aff.id_affectation}>
                                    <TableCell>{aff.cours?.nom_cours || '-'}</TableCell>
                                    <TableCell>{aff.groupe?.nom_groupe || '-'}</TableCell>
                                    <TableCell>
                                        {aff.enseignant?.prenom || ''} {aff.enseignant?.nom || '-'}
                                    </TableCell>
                                    <TableCell>{aff.salle?.nom_salle || '-'}</TableCell>
                                    <TableCell>
                                        {new Date(aff.date_seance).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell>
                                        {aff.creneau?.heure_debut} - {aff.creneau?.heure_fin}
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={aff.statut}
                                            size="small"
                                            color={
                                                aff.statut === 'confirme'
                                                    ? 'success'
                                                    : aff.statut === 'annule'
                                                      ? 'error'
                                                      : 'default'
                                            }
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEdit(aff)}
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleDelete(aff.id_affectation)}
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
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
                </TableContainer>

                {/* Dialog pour créer/modifier */}
                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
                    <form onSubmit={formik.handleSubmit}>
                        <DialogTitle>
                            {editing ? 'Modifier l\'affectation' : 'Nouvelle affectation'}
                        </DialogTitle>
                        <DialogContent>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                                <FormControl fullWidth>
                                    <InputLabel>Cours</InputLabel>
                                    <Select
                                        name="id_cours"
                                        value={formik.values.id_cours}
                                        onChange={formik.handleChange}
                                        label="Cours"
                                    >
                                        {options.cours.map((cours) => (
                                            <MenuItem key={cours.id_cours} value={cours.id_cours}>
                                                {cours.nom_cours}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel>Groupe</InputLabel>
                                    <Select
                                        name="id_groupe"
                                        value={formik.values.id_groupe}
                                        onChange={formik.handleChange}
                                        label="Groupe"
                                    >
                                        {options.groupes.map((groupe) => (
                                            <MenuItem key={groupe.id_groupe} value={groupe.id_groupe}>
                                                {groupe.nom_groupe}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel>Enseignant</InputLabel>
                                    <Select
                                        name="id_user_enseignant"
                                        value={formik.values.id_user_enseignant}
                                        onChange={formik.handleChange}
                                        label="Enseignant"
                                    >
                                        {options.enseignants.map((ens) => (
                                            <MenuItem key={ens.id_user} value={ens.id_user}>
                                                {ens.user?.prenom} {ens.user?.nom}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel>Salle</InputLabel>
                                    <Select
                                        name="id_salle"
                                        value={formik.values.id_salle}
                                        onChange={formik.handleChange}
                                        label="Salle"
                                    >
                                        {options.salles.map((salle) => (
                                            <MenuItem key={salle.id_salle} value={salle.id_salle}>
                                                {salle.nom_salle} ({salle.capacite} places)
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth>
                                    <InputLabel>Créneau</InputLabel>
                                    <Select
                                        name="id_creneau"
                                        value={formik.values.id_creneau}
                                        onChange={formik.handleChange}
                                        label="Créneau"
                                    >
                                        {options.creneaux.map((creneau) => (
                                            <MenuItem key={creneau.id_creneau} value={creneau.id_creneau}>
                                                {creneau.jour_semaine} {creneau.heure_debut} - {creneau.heure_fin}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <input
                                    type="date"
                                    name="date_seance"
                                    value={formik.values.date_seance}
                                    onChange={formik.handleChange}
                                    style={{
                                        padding: '16.5px 14px',
                                        border: '1px solid rgba(0, 0, 0, 0.23)',
                                        borderRadius: '4px',
                                    }}
                                />

                                <FormControl fullWidth>
                                    <InputLabel>Statut</InputLabel>
                                    <Select
                                        name="statut"
                                        value={formik.values.statut}
                                        onChange={formik.handleChange}
                                        label="Statut"
                                    >
                                        <MenuItem value="planifie">Planifié</MenuItem>
                                        <MenuItem value="confirme">Confirmé</MenuItem>
                                        <MenuItem value="annule">Annulé</MenuItem>
                                        <MenuItem value="reporte">Reporté</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpen(false)}>Annuler</Button>
                            <Button type="submit" variant="contained">
                                {editing ? 'Modifier' : 'Créer'}
                            </Button>
                        </DialogActions>
                    </form>
                </Dialog>
            </Box>
        </DashboardLayout>
    );
}

