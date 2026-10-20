import { useTranslation } from 'react-i18next';
import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { TYPES_RESERVATION } from './reservation';

/**
 * Nouvelle réservation de salle (administration) : type, intitulé, participants, date et heures,
 * salle obligatoire. Le jury n'apparaît que pour une soutenance ; « Trouver un créneau » ouvre
 * l'assistant (`onTrouverCreneau`). `form` est l'état du formulaire, `setForm` le modifie.
 * `references` : { salles, enseignants, groupes }.
 */
export default function ReservationDialog({ form, setForm, references, onClose, onEnregistrer, onTrouverCreneau }) {
    const { t } = useTranslation();
    const champ = (nom) => (e) => setForm((f) => ({ ...f, [nom]: e.target.value }));
    const soutenance = form?.type === 'soutenance';

    return (
        <Dialog open={Boolean(form)} onClose={onClose} maxWidth="sm" fullWidth>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onEnregistrer();
                }}
            >
                <DialogTitle>{t('resa.add')}</DialogTitle>
                <DialogContent>
                    {form && (
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField select label={t('resa.fields.type')} value={form.type} onChange={champ('type')} sx={{ minWidth: 180 }}>
                                    {TYPES_RESERVATION.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {t(`resa.types.${type}`)}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField label={t('resa.fields.title')} value={form.titre} onChange={champ('titre')} required fullWidth />
                            </Stack>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField type="date" label={t('resa.fields.date')} value={form.date} onChange={champ('date')} InputLabelProps={{ shrink: true }} required fullWidth />
                                <TextField type="time" label={t('resa.fields.start')} value={form.heure_debut} onChange={champ('heure_debut')} InputLabelProps={{ shrink: true }} required sx={{ minWidth: 130 }} />
                                <TextField type="time" label={t('resa.fields.end')} value={form.heure_fin} onChange={champ('heure_fin')} InputLabelProps={{ shrink: true }} required sx={{ minWidth: 130 }} />
                            </Stack>
                            {/* Une salle toujours : c'est l'objet de la réservation */}
                            <TextField select label={t('resa.fields.room')} value={form.id_salle} onChange={champ('id_salle')} required>
                                {references.salles.map((s) => (
                                    <MenuItem key={s.id_salle} value={s.id_salle}>
                                        {s.nom_salle} · {s.type_salle} · {s.capacite} {t('resa.places')}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <Box>
                                <Button startIcon={<AutoAwesome />} onClick={onTrouverCreneau}>
                                    {t('resa.findSlot')}
                                </Button>
                            </Box>
                            <Autocomplete
                                multiple
                                options={references.enseignants.filter((e) => e.user)}
                                value={form.personnes}
                                onChange={(_, v) => setForm((f) => ({ ...f, personnes: v }))}
                                getOptionLabel={(e) => `${e.user.nom} ${e.user.prenom}`}
                                isOptionEqualToValue={(a, b) => a.id_user === b.id_user}
                                renderInput={(params) => <TextField {...params} label={soutenance ? t('resa.fields.jury') : t('resa.fields.people')} />}
                            />
                            <Autocomplete
                                multiple
                                options={references.groupes}
                                value={form.groupes}
                                onChange={(_, v) => setForm((f) => ({ ...f, groupes: v }))}
                                getOptionLabel={(g) => g.nom_groupe}
                                isOptionEqualToValue={(a, b) => a.id_groupe === b.id_groupe}
                                renderInput={(params) => <TextField {...params} label={t('resa.fields.groups')} />}
                            />
                            <TextField label={t('resa.fields.description')} value={form.description} onChange={champ('description')} multiline minRows={2} />
                        </Stack>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>{t('common.cancel')}</Button>
                    <Button type="submit" variant="contained">
                        {t('resa.book')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
