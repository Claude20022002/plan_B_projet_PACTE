import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
} from '@mui/material';
import { formatHeure } from '../../utils/session';

/** Fenêtre de planification et de modification d'une séance : `formik` porte les valeurs, `options` les listes à choisir. */
export default function SeanceDialog({ open, editing, formik, options, onClose }) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <form onSubmit={formik.handleSubmit}>
                <DialogTitle>
                    {editing ? 'Modifier l\'affectation' : 'Nouvelle affectation'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel id="seance-id_cours">Cours</InputLabel>
                            <Select labelId="seance-id_cours"
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
                            <InputLabel id="seance-id_groupe">Groupe</InputLabel>
                            <Select labelId="seance-id_groupe"
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
                            <InputLabel id="seance-id_user_enseignant">Enseignant</InputLabel>
                            <Select labelId="seance-id_user_enseignant"
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
                            <InputLabel id="seance-id_salle">Salle</InputLabel>
                            <Select labelId="seance-id_salle"
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
                            <InputLabel id="seance-id_creneau">Créneau</InputLabel>
                            <Select labelId="seance-id_creneau"
                                name="id_creneau"
                                value={formik.values.id_creneau}
                                onChange={formik.handleChange}
                                label="Créneau"
                            >
                                {options.creneaux.map((creneau) => (
                                    <MenuItem key={creneau.id_creneau} value={creneau.id_creneau}>
                                        {creneau.jour_semaine} {formatHeure(creneau.heure_debut)} – {formatHeure(creneau.heure_fin)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <TextField
                            type="date"
                            name="date_seance"
                            label="Date"
                            value={formik.values.date_seance}
                            onChange={formik.handleChange}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            fullWidth
                        />

                        <FormControl fullWidth>
                            <InputLabel id="seance-statut">Statut</InputLabel>
                            <Select labelId="seance-statut"
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
                    <Button onClick={onClose}>Annuler</Button>
                    <Button type="submit" variant="contained">
                        {editing ? 'Modifier' : 'Créer'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
