import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Add, Edit, Delete, Visibility } from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { affectationAPI, coursAPI, groupeAPI, salleAPI, creneauAPI, enseignantAPI } from '../../services/api';
import { useFormik } from 'formik';
import * as yup from 'yup';

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
    const [affectations, setAffectations] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
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
                cours: cours.data || [],
                groupes: groupes.data || [],
                salles: salles.data || [],
                creneaux: creneaux.data || [],
                enseignants: enseignants.data || [],
            });
        } catch (error) {
            console.error('Erreur:', error);
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
        onSubmit: async (values) => {
            try {
                if (editing) {
                    await affectationAPI.update(editing.id_affectation, values);
                } else {
                    await affectationAPI.create(values);
                }
                formik.resetForm();
                setOpen(false);
                setEditing(null);
                loadAffectations();
            } catch (error) {
                console.error('Erreur:', error);
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Gestion des Affectations
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => {
                            setEditing(null);
                            formik.resetForm();
                            setOpen(true);
                        }}
                    >
                        Nouvelle affectation
                    </Button>
                </Box>

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

