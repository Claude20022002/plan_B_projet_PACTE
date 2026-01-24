import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    FormControlLabel,
    Grid,
    Card,
    CardContent,
    Alert,
    CircularProgress,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Divider,
} from '@mui/material';
import {
    PlayArrow,
    CheckCircle,
    Error as ErrorIcon,
    Info,
} from '@mui/icons-material';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import { generationAutomatiqueAPI, coursAPI, groupeAPI } from '../../services/api';

export default function GenerationAutomatique() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [cours, setCours] = useState([]);
    const [groupes, setGroupes] = useState([]);
    const [selectedCours, setSelectedCours] = useState([]);
    const [selectedGroupes, setSelectedGroupes] = useState([]);
    const [dateDebut, setDateDebut] = useState('');
    const [dateFin, setDateFin] = useState('');
    const [ecraserAffectations, setEcraserAffectations] = useState(false);
    const [resultat, setResultat] = useState(null);
    const [error, setError] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [coursData, groupesData] = await Promise.all([
                coursAPI.getAll(),
                groupeAPI.getAll(),
            ]);
            setCours(coursData.data || coursData || []);
            setGroupes(groupesData.data || groupesData || []);
        } catch (err) {
            console.error('Erreur lors du chargement des données:', err);
            setError('Erreur lors du chargement des données');
        }
    };

    const handleGenerer = async () => {
        if (!dateDebut || !dateFin) {
            setError('Veuillez sélectionner les dates de début et de fin');
            return;
        }

        if (new Date(dateDebut) >= new Date(dateFin)) {
            setError('La date de début doit être antérieure à la date de fin');
            return;
        }

        setLoading(true);
        setError('');
        setResultat(null);

        try {
            const data = {
                dateDebut,
                dateFin,
                coursIds: selectedCours,
                groupeIds: selectedGroupes,
                ecraserAffectations,
            };

            const response = await generationAutomatiqueAPI.generer(data);
            setResultat(response.resultat);
            setDialogOpen(true);
        } catch (err) {
            console.error('Erreur lors de la génération:', err);
            setError(err.message || 'Erreur lors de la génération automatique');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Génération Automatique d'Affectations
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Générez automatiquement les affectations de cours en fonction des disponibilités des enseignants,
                    du volume horaire des cours et des contraintes de salles.
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    {/* Formulaire de configuration */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Configuration
                            </Typography>
                            <Divider sx={{ mb: 3 }} />

                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Date de début"
                                        type="date"
                                        value={dateDebut}
                                        onChange={(e) => setDateDebut(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Date de fin"
                                        type="date"
                                        value={dateFin}
                                        onChange={(e) => setDateFin(e.target.value)}
                                        InputLabelProps={{ shrink: true }}
                                        required
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Cours à planifier</InputLabel>
                                        <Select
                                            multiple
                                            value={selectedCours}
                                            onChange={(e) => setSelectedCours(e.target.value)}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((id) => {
                                                        const coursItem = cours.find((c) => c.id_cours === id);
                                                        return (
                                                            <Chip
                                                                key={id}
                                                                label={coursItem?.nom_cours || id}
                                                                size="small"
                                                            />
                                                        );
                                                    })}
                                                </Box>
                                            )}
                                        >
                                            {cours.map((coursItem) => (
                                                <MenuItem key={coursItem.id_cours} value={coursItem.id_cours}>
                                                    <Checkbox checked={selectedCours.indexOf(coursItem.id_cours) > -1} />
                                                    {coursItem.nom_cours} ({coursItem.volume_horaire}h)
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                        Laissez vide pour planifier tous les cours
                                    </Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>Groupes à planifier</InputLabel>
                                        <Select
                                            multiple
                                            value={selectedGroupes}
                                            onChange={(e) => setSelectedGroupes(e.target.value)}
                                            renderValue={(selected) => (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                    {selected.map((id) => {
                                                        const groupe = groupes.find((g) => g.id_groupe === id);
                                                        return (
                                                            <Chip
                                                                key={id}
                                                                label={groupe?.nom_groupe || id}
                                                                size="small"
                                                            />
                                                        );
                                                    })}
                                                </Box>
                                            )}
                                        >
                                            {groupes.map((groupe) => (
                                                <MenuItem key={groupe.id_groupe} value={groupe.id_groupe}>
                                                    <Checkbox checked={selectedGroupes.indexOf(groupe.id_groupe) > -1} />
                                                    {groupe.nom_groupe} ({groupe.effectif} étudiants)
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                        Laissez vide pour planifier tous les groupes
                                    </Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={ecraserAffectations}
                                                onChange={(e) => setEcraserAffectations(e.target.checked)}
                                            />
                                        }
                                        label="Écraser les affectations existantes pour ces cours/groupes"
                                    />
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                        Si coché, les affectations existantes pour les cours/groupes sélectionnés seront supprimées avant la génération
                                    </Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
                                        onClick={handleGenerer}
                                        disabled={loading || !dateDebut || !dateFin}
                                        fullWidth
                                    >
                                        {loading ? 'Génération en cours...' : 'Générer les affectations'}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Informations */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                <Info sx={{ verticalAlign: 'middle', mr: 1 }} />
                                Informations
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2" paragraph>
                                L'algorithme de génération automatique prend en compte :
                            </Typography>
                            <Box component="ul" sx={{ pl: 2 }}>
                                <li>Les disponibilités des enseignants</li>
                                <li>Le volume horaire de chaque cours</li>
                                <li>Les contraintes de salles (capacité)</li>
                                <li>Les événements bloquants du semestre</li>
                                <li>Les conflits existants</li>
                            </Box>
                            <Alert severity="info" sx={{ mt: 2 }}>
                                Les affectations générées auront le statut "planifié" et pourront être modifiées manuellement si nécessaire.
                            </Alert>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Dialog de résultats */}
                <Dialog
                    open={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogTitle>
                        Résultats de la génération automatique
                    </DialogTitle>
                    <DialogContent>
                        {resultat && (
                            <Box>
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={12} sm={4}>
                                        <Card>
                                            <CardContent>
                                                <Typography color="textSecondary" gutterBottom>
                                                    Séances créées
                                                </Typography>
                                                <Typography variant="h4" color="success.main">
                                                    {resultat.statistiques.totalSeancesPlanifiees}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Card>
                                            <CardContent>
                                                <Typography color="textSecondary" gutterBottom>
                                                    Séances échouées
                                                </Typography>
                                                <Typography variant="h4" color="error.main">
                                                    {resultat.statistiques.totalSeancesEchouees}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Card>
                                            <CardContent>
                                                <Typography color="textSecondary" gutterBottom>
                                                    Conflits détectés
                                                </Typography>
                                                <Typography variant="h4" color="warning.main">
                                                    {resultat.statistiques.conflitsDetectes}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>

                                {resultat.affectationsEchouees.length > 0 && (
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="h6" gutterBottom>
                                            Affectations échouées
                                        </Typography>
                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Cours</TableCell>
                                                        <TableCell>Groupe</TableCell>
                                                        <TableCell>Date</TableCell>
                                                        <TableCell>Créneau</TableCell>
                                                        <TableCell>Raison</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {resultat.affectationsEchouees.slice(0, 10).map((aff, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>{aff.cours}</TableCell>
                                                            <TableCell>{aff.groupe}</TableCell>
                                                            <TableCell>{aff.date}</TableCell>
                                                            <TableCell>{aff.creneau}</TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={aff.raison}
                                                                    size="small"
                                                                    color="error"
                                                                />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        {resultat.affectationsEchouees.length > 10 && (
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                                ... et {resultat.affectationsEchouees.length - 10} autres
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogOpen(false)}>Fermer</Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                setDialogOpen(false);
                                window.location.href = '/gestion/affectations';
                            }}
                        >
                            Voir les affectations
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </DashboardLayout>
    );
}
