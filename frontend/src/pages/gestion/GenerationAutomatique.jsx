import React, { useState, useEffect, useRef } from "react";
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
} from "@mui/material";
import {
    PlayArrow,
    CheckCircle,
    Error as ErrorIcon,
    Info,
} from "@mui/icons-material";
import DashboardLayout from "../../components/layouts/DashboardLayout";
import { useAuth } from "../../contexts/AuthContext";
import {
    generationAutomatiqueAPI,
    coursAPI,
    groupeAPI,
} from "../../services/api";

export default function GenerationAutomatique() {
    const { user } = useAuth();
    const isMountedRef = useRef(true);
    const [loading, setLoading] = useState(false);
    const [cours, setCours] = useState([]);
    const [groupes, setGroupes] = useState([]);
    const [selectedCours, setSelectedCours] = useState([]);
    const [selectedGroupes, setSelectedGroupes] = useState([]);
    const [dateDebut, setDateDebut] = useState("");
    const [dateFin, setDateFin] = useState("");
    const [ecraserAffectations, setEcraserAffectations] = useState(false);
    const [maxSessionHours, setMaxSessionHours] = useState(4);
    const [maxHoursPerDayGroup, setMaxHoursPerDayGroup] = useState(6);
    const [maxHoursPerDayCourse, setMaxHoursPerDayCourse] = useState(4);
    const [allowSameCourseTwicePerDay, setAllowSameCourseTwicePerDay] =
        useState(false);
    const [resultat, setResultat] = useState(null);
    const [error, setError] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            console.log("Chargement des données...");
            const [coursData, groupesData] = await Promise.all([
                coursAPI.getAll({ limit: 1000 }),
                groupeAPI.getAll({ limit: 1000 }),
            ]);
            console.log("Données reçues - Cours:", coursData);
            console.log("Données reçues - Groupes:", groupesData);
            
            if (isMountedRef.current) {
                // Gérer différentes structures de réponses possibles
                const coursList = Array.isArray(coursData) ? coursData : 
                                (coursData.data && Array.isArray(coursData.data)) ? coursData.data : [];
                const groupesList = Array.isArray(groupesData) ? groupesData : 
                                  (groupesData.data && Array.isArray(groupesData.data)) ? groupesData.data : [];
                
                console.log("Listes traitées - Cours:", coursList.length, "Groupes:", groupesList.length);
                setCours(coursList);
                setGroupes(groupesList);
                
                if (coursList.length === 0 || groupesList.length === 0) {
                    console.warn("Attention: Une des listes est vide");
                }
            }
        } catch (err) {
            console.error("Erreur lors du chargement des données:", err);
            if (isMountedRef.current) {
                if (err.status === 401) {
                    setError("Erreur d'authentification. Veuillez vous reconnecter.");
                } else if (err.isConnectionError) {
                    setError("Impossible de se connecter au serveur. Vérifiez que le backend est démarré.");
                } else {
                    setError(`Erreur lors du chargement des données: ${err.message || 'Erreur inconnue'}`);
                }
            }
        }
    };

    const handleGenerer = async () => {
        if (!dateDebut || !dateFin) {
            if (isMountedRef.current) {
                setError("Veuillez sélectionner les dates de début et de fin");
            }
            return;
        }

        if (new Date(dateDebut) >= new Date(dateFin)) {
            if (isMountedRef.current) {
                setError(
                    "La date de début doit être antérieure à la date de fin",
                );
            }
            return;
        }

        setLoading(true);
        setError("");
        setResultat(null);

        try {
            const data = {
                dateDebut,
                dateFin,
                coursIds: selectedCours,
                groupeIds: selectedGroupes,
                ecraserAffectations,
                maxSessionHours: Number(maxSessionHours),
                maxHoursPerDayGroup: Number(maxHoursPerDayGroup),
                maxHoursPerDayCourse: Number(maxHoursPerDayCourse),
                allowSameCourseTwicePerDay,
            };

            const response = await generationAutomatiqueAPI.generer(data);
            if (isMountedRef.current) {
                setResultat(response.resultat);
                setDialogOpen(true);
            }
        } catch (err) {
            console.error("Erreur lors de la génération:", err);
            // Gérer les erreurs d'authentification
            if (err.status === 401) {
                if (isMountedRef.current) {
                    setError(
                        "Votre session a expiré. Veuillez vous reconnecter.",
                    );
                }
                // Optionnel: rediriger vers la page de connexion
                setTimeout(() => {
                    window.location.href = "/connexion";
                }, 2000);
            } else {
                if (isMountedRef.current) {
                    setError(
                        err.message ||
                            "Erreur lors de la génération automatique",
                    );
                }
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    };

    return (
        <DashboardLayout>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                    Génération Automatique d'Affectations
                </Typography>
                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 4 }}
                >
                    Générez automatiquement les affectations de cours en
                    fonction des disponibilités des enseignants, du volume
                    horaire des cours et des contraintes de salles.
                </Typography>

                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3 }}
                        onClose={() => setError("")}
                    >
                        {error}
                    </Alert>
                )}

                {/* Indicateurs de chargement et état des données */}
                {cours.length === 0 && groupes.length === 0 && !error && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Chargement des données en cours...
                    </Alert>
                )}

                {cours.length === 0 && !error && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        Aucun cours trouvé. Veuillez d'abord créer des cours avant de générer les emplois du temps.
                    </Alert>
                )}

                {groupes.length === 0 && !error && (
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        Aucun groupe trouvé. Veuillez d'abord créer des groupes avant de générer les emplois du temps.
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
                                        onChange={(e) =>
                                            setDateDebut(e.target.value)
                                        }
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
                                        onChange={(e) =>
                                            setDateFin(e.target.value)
                                        }
                                        InputLabelProps={{ shrink: true }}
                                        required
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>
                                            Cours à planifier
                                        </InputLabel>
                                        <Select
                                            multiple
                                            value={selectedCours}
                                            onChange={(e) =>
                                                setSelectedCours(e.target.value)
                                            }
                                            disabled={cours.length === 0}
                                            renderValue={(selected) => (
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        flexWrap: "wrap",
                                                        gap: 0.5,
                                                    }}
                                                >
                                                    {selected.map((id) => {
                                                        const coursItem =
                                                            cours.find(
                                                                (c) =>
                                                                    c.id_cours ===
                                                                    id,
                                                            );
                                                        return (
                                                            <Chip
                                                                key={id}
                                                                label={
                                                                    coursItem?.nom_cours ||
                                                                    id
                                                                }
                                                                size="small"
                                                            />
                                                        );
                                                    })}
                                                </Box>
                                            )}
                                        >
                                            {cours.length === 0 ? (
                                                <MenuItem disabled>
                                                    Aucun cours disponible
                                                </MenuItem>
                                            ) : (
                                                cours.map((coursItem) => (
                                                    <MenuItem
                                                        key={coursItem.id_cours}
                                                        value={coursItem.id_cours}
                                                    >
                                                        <Checkbox
                                                            checked={
                                                                selectedCours.indexOf(
                                                                    coursItem.id_cours,
                                                                ) > -1
                                                            }
                                                        />
                                                        {coursItem.nom_cours} (
                                                        {coursItem.volume_horaire || 0}h)
                                                    </MenuItem>
                                                ))
                                            )}
                                        </Select>
                                    </FormControl>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ mt: 1 }}
                                    >
                                        Laissez vide pour planifier tous les
                                        cours
                                    </Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControl fullWidth>
                                        <InputLabel>
                                            Groupes à planifier
                                        </InputLabel>
                                        <Select
                                            multiple
                                            value={selectedGroupes}
                                            onChange={(e) =>
                                                setSelectedGroupes(
                                                    e.target.value,
                                                )
                                            }
                                            disabled={groupes.length === 0}
                                            renderValue={(selected) => (
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        flexWrap: "wrap",
                                                        gap: 0.5,
                                                    }}
                                                >
                                                    {selected.map((id) => {
                                                        const groupe =
                                                            groupes.find(
                                                                (g) =>
                                                                    g.id_groupe ===
                                                                    id,
                                                            );
                                                        return (
                                                            <Chip
                                                                key={id}
                                                                label={
                                                                    groupe?.nom_groupe ||
                                                                    id
                                                                }
                                                                size="small"
                                                            />
                                                        );
                                                    })}
                                                </Box>
                                            )}
                                        >
                                            {groupes.length === 0 ? (
                                                <MenuItem disabled>
                                                    Aucun groupe disponible
                                                </MenuItem>
                                            ) : (
                                                groupes.map((groupe) => (
                                                    <MenuItem
                                                        key={groupe.id_groupe}
                                                        value={groupe.id_groupe}
                                                    >
                                                        <Checkbox
                                                            checked={
                                                                selectedGroupes.indexOf(
                                                                    groupe.id_groupe,
                                                                ) > -1
                                                            }
                                                        />
                                                        {groupe.nom_groupe} (
                                                        {groupe.effectif || 0} étudiants)
                                                    </MenuItem>
                                                ))
                                            )}
                                        </Select>
                                    </FormControl>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ mt: 1 }}
                                    >
                                        Laissez vide pour planifier tous les
                                        groupes
                                    </Typography>
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={ecraserAffectations}
                                                onChange={(e) =>
                                                    setEcraserAffectations(
                                                        e.target.checked,
                                                    )
                                                }
                                            />
                                        }
                                        label="Écraser les affectations existantes pour ces cours/groupes"
                                    />
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ display: "block", mt: 1 }}
                                    >
                                        Si coché, les affectations existantes
                                        pour les cours/groupes sélectionnés
                                        seront supprimées avant la génération
                                    </Typography>
                                </Grid>

                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Durée max par séance (h)"
                                        type="number"
                                        value={maxSessionHours}
                                        onChange={(e) =>
                                            setMaxSessionHours(e.target.value)
                                        }
                                        inputProps={{
                                            min: 1,
                                            max: 6,
                                            step: 0.5,
                                        }}
                                        helperText="Ex: 2, 3 ou 4 heures"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Max heures/jour (groupe)"
                                        type="number"
                                        value={maxHoursPerDayGroup}
                                        onChange={(e) =>
                                            setMaxHoursPerDayGroup(
                                                e.target.value,
                                            )
                                        }
                                        inputProps={{
                                            min: 1,
                                            max: 12,
                                            step: 0.5,
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Max heures/jour (module)"
                                        type="number"
                                        value={maxHoursPerDayCourse}
                                        onChange={(e) =>
                                            setMaxHoursPerDayCourse(
                                                e.target.value,
                                            )
                                        }
                                        inputProps={{
                                            min: 1,
                                            max: 8,
                                            step: 0.5,
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={
                                                    allowSameCourseTwicePerDay
                                                }
                                                onChange={(e) =>
                                                    setAllowSameCourseTwicePerDay(
                                                        e.target.checked,
                                                    )
                                                }
                                            />
                                        }
                                        label="Autoriser plusieurs séances du même module le même jour"
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={
                                            loading ? (
                                                <CircularProgress size={20} />
                                            ) : (
                                                <PlayArrow />
                                            )
                                        }
                                        onClick={handleGenerer}
                                        disabled={
                                            loading || !dateDebut || !dateFin
                                        }
                                        fullWidth
                                    >
                                        {loading
                                            ? "Génération en cours..."
                                            : "Générer les affectations"}
                                    </Button>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Informations */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                <Info sx={{ verticalAlign: "middle", mr: 1 }} />
                                Informations
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="body2" paragraph>
                                L'algorithme de génération automatique prend en
                                compte :
                            </Typography>
                            <Box component="ul" sx={{ pl: 2 }}>
                                <li>Les disponibilités des enseignants</li>
                                <li>Le volume horaire de chaque cours</li>
                                <li>Les contraintes de salles (capacité)</li>
                                <li>Les événements bloquants du semestre</li>
                                <li>Les conflits existants</li>
                            </Box>
                            <Alert severity="info" sx={{ mt: 2 }}>
                                Les affectations générées auront le statut
                                "planifié" et pourront être modifiées
                                manuellement si nécessaire.
                            </Alert>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Dialog de résultats */}
                <Dialog
                    open={dialogOpen}
                    onClose={() => {
                        if (isMountedRef.current) {
                            setDialogOpen(false);
                        }
                    }}
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
                                                <Typography
                                                    color="textSecondary"
                                                    gutterBottom
                                                >
                                                    Séances créées
                                                </Typography>
                                                <Typography
                                                    variant="h4"
                                                    color="success.main"
                                                >
                                                    {
                                                        resultat.statistiques
                                                            .totalSeancesPlanifiees
                                                    }
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Card>
                                            <CardContent>
                                                <Typography
                                                    color="textSecondary"
                                                    gutterBottom
                                                >
                                                    Séances échouées
                                                </Typography>
                                                <Typography
                                                    variant="h4"
                                                    color="error.main"
                                                >
                                                    {
                                                        resultat.statistiques
                                                            .totalSeancesEchouees
                                                    }
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Card>
                                            <CardContent>
                                                <Typography
                                                    color="textSecondary"
                                                    gutterBottom
                                                >
                                                    Conflits détectés
                                                </Typography>
                                                <Typography
                                                    variant="h4"
                                                    color="warning.main"
                                                >
                                                    {
                                                        resultat.statistiques
                                                            .conflitsDetectes
                                                    }
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
                                                        <TableCell>
                                                            Cours
                                                        </TableCell>
                                                        <TableCell>
                                                            Groupe
                                                        </TableCell>
                                                        <TableCell>
                                                            Date
                                                        </TableCell>
                                                        <TableCell>
                                                            Créneau
                                                        </TableCell>
                                                        <TableCell>
                                                            Raison
                                                        </TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {resultat.affectationsEchouees
                                                        .slice(0, 10)
                                                        .map((aff, index) => (
                                                            <TableRow
                                                                key={index}
                                                            >
                                                                <TableCell>
                                                                    {aff.cours}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {aff.groupe}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {aff.date}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {
                                                                        aff.creneau
                                                                    }
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        label={
                                                                            aff.raison
                                                                        }
                                                                        size="small"
                                                                        color="error"
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        {resultat.affectationsEchouees.length >
                                            10 && (
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ mt: 1, display: "block" }}
                                            >
                                                ... et{" "}
                                                {resultat.affectationsEchouees
                                                    .length - 10}{" "}
                                                autres
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => {
                                if (isMountedRef.current) {
                                    setDialogOpen(false);
                                }
                            }}
                        >
                            Fermer
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => {
                                window.location.href = "/gestion/affectations";
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
