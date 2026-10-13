import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    MenuItem,
    Stack,
    Switch,
    TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { EVENEMENT_VIDE, PORTEES, TYPES_EVENEMENT } from './constantes';

/** Fenêtre de création et de modification d'un événement du calendrier. */
export default function EvenementDialog({ etat, setEtat, cibles, onSubmit }) {
    const { t } = useTranslation();
    const fermer = () => setEtat({ open: false, editing: null, form: EVENEMENT_VIDE });
    const champ = (nom) => (event) =>
        setEtat((d) => ({ ...d, form: { ...d.form, [nom]: event.target.value, ...(nom === 'portee' ? { id_cible: '', niveau: '' } : {}) } }));

    return (
        <Dialog open={etat.open} onClose={() => fermer()} maxWidth="sm" fullWidth>
            <form onSubmit={onSubmit}>
                <DialogTitle>{etat.editing ? t('ref.calendar.editEvent') : t('ref.calendar.addEvent')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label={t('ref.calendar.fields.title')} value={etat.form.titre} onChange={champ('titre')} required autoFocus />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField select fullWidth label={t('ref.calendar.fields.type')} value={etat.form.type_evenement} onChange={champ('type_evenement')}>
                                {TYPES_EVENEMENT.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {t(`ref.eventTypes.${type}`)}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField fullWidth type="date" label={t('ref.calendar.fields.start')} value={etat.form.date_debut} onChange={champ('date_debut')} InputLabelProps={{ shrink: true }} required />
                            <TextField fullWidth type="date" label={t('ref.calendar.fields.end')} value={etat.form.date_fin} onChange={champ('date_fin')} InputLabelProps={{ shrink: true }} required />
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField select fullWidth label={t('ref.calendar.fields.scope')} value={etat.form.portee} onChange={champ('portee')}>
                                {PORTEES.map((portee) => (
                                    <MenuItem key={portee} value={portee}>
                                        {t(`ref.scopes.${portee}`)}
                                    </MenuItem>
                                ))}
                            </TextField>
                            {etat.form.portee === 'campus' && (
                                <TextField select fullWidth label={t('ref.calendar.fields.campus')} value={etat.form.id_cible} onChange={champ('id_cible')} required>
                                    {cibles.campus.map((c) => (
                                        <MenuItem key={c.id_campus} value={c.id_campus}>
                                            {c.nom}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                            {['filiere', 'niveau'].includes(etat.form.portee) && (
                                <TextField select fullWidth label={t('ref.calendar.fields.program')} value={etat.form.id_cible} onChange={champ('id_cible')} required>
                                    {cibles.filieres.map((f) => (
                                        <MenuItem key={f.id_filiere} value={f.id_filiere}>
                                            {f.nom_filiere}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                            {etat.form.portee === 'niveau' && (
                                <TextField fullWidth label={t('ref.calendar.fields.level')} value={etat.form.niveau} onChange={champ('niveau')} placeholder="3ème année" required />
                            )}
                            {etat.form.portee === 'groupe' && (
                                <TextField select fullWidth label={t('ref.calendar.fields.group')} value={etat.form.id_cible} onChange={champ('id_cible')} required>
                                    {cibles.groupes.map((g) => (
                                        <MenuItem key={g.id_groupe} value={g.id_groupe}>
                                            {g.nom_groupe}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField fullWidth type="time" label={t('ref.calendar.fields.timeStart')} value={etat.form.heure_debut} onChange={champ('heure_debut')} InputLabelProps={{ shrink: true }} helperText={t('ref.calendar.fields.timeHelp')} />
                            <TextField fullWidth type="time" label={t('ref.calendar.fields.timeEnd')} value={etat.form.heure_fin} onChange={champ('heure_fin')} InputLabelProps={{ shrink: true }} />
                        </Stack>
                        <TextField label={t('ref.calendar.fields.description')} value={etat.form.description} onChange={champ('description')} multiline minRows={2} />
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={etat.form.bloque_affectations}
                                    onChange={(e) => setEtat((d) => ({ ...d, form: { ...d.form, bloque_affectations: e.target.checked } }))}
                                />
                            }
                            label={t('ref.calendar.fields.blocking')}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => fermer()}>{t('common.cancel')}</Button>
                    <Button type="submit" variant="contained">
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
