import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { COMPOSANTE_VIDE, MODALITES, NIVEAUX_GROUPE, TYPES } from './constantes';
import { libelleSeance } from './formatage';

/** Fenêtre de création et de modification d'une composante (CM, TD, TP, Projet) d'un module. */
export default function ComposanteDialog({ etat, setEtat, typesSalle, onSubmit }) {
    const { t } = useTranslation();
    const fermer = () => setEtat({ open: false, module: null, editing: null, form: COMPOSANTE_VIDE });
    const champ = (nom) => (e) =>
        setEtat((d) => {
            const form = { ...d.form, [nom]: e.target.value };
            // Le groupe visé suit le type tant que l'utilisateur ne l'a pas choisi lui-même
            if (nom === 'type' && !d.editing) form.niveau_groupe = { CM: 'promotion', TD: 'td', TP: 'tp', Projet: 'td' }[e.target.value];
            return { ...d, form };
        });

    return (
        <Dialog open={etat.open} onClose={() => fermer()} maxWidth="sm" fullWidth>
            <form onSubmit={onSubmit}>
                <DialogTitle>
                    {etat.editing ? t('ref.curriculum.editComponent') : t('ref.curriculum.addComponent')}
                    <Typography variant="body2" color="text.secondary">
                        {etat.module?.nom_cours}
                    </Typography>
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField select fullWidth label={t('ref.curriculum.compFields.type')} value={etat.form.type} onChange={champ('type')}>
                                {TYPES.map((type) => (
                                    <MenuItem key={type} value={type} disabled={!etat.editing && etat.module?.composantes.some((c) => c.type === type)}>
                                        {type}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField fullWidth type="number" label={t('ref.curriculum.compFields.volume')} value={etat.form.volume_heures} onChange={champ('volume_heures')} inputProps={{ min: 0.5, step: 0.5 }} required />
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField select fullWidth label={t('ref.curriculum.compFields.group')} value={etat.form.niveau_groupe} onChange={champ('niveau_groupe')}>
                                {NIVEAUX_GROUPE.map((n) => (
                                    <MenuItem key={n} value={n}>
                                        {t(`ref.groupTypes.${n}`)}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField
                                select
                                fullWidth
                                label={t('ref.curriculum.compFields.session')}
                                value={etat.form.creneaux_par_seance}
                                onChange={champ('creneaux_par_seance')}
                                helperText={t('ref.curriculum.compFields.sessionHelp')}
                            >
                                {[1, 2, 3, 4].map((n) => (
                                    <MenuItem key={n} value={n}>
                                        {libelleSeance(t, n)}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField select fullWidth label={t('ref.curriculum.compFields.mode')} value={etat.form.modalite} onChange={champ('modalite')}>
                                {MODALITES.map((m) => (
                                    <MenuItem key={m} value={m}>
                                        {t(`ref.modes.${m}`)}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField fullWidth label={t('ref.curriculum.compFields.mention')} value={etat.form.mention} onChange={champ('mention')} placeholder="Blended Coursera" />
                        </Stack>
                        {etat.form.modalite !== 'distanciel' && (
                            <TextField select label={t('ref.curriculum.compFields.room')} value={etat.form.type_salle_requis} onChange={champ('type_salle_requis')}>
                                <MenuItem value="">{t('ref.curriculum.compFields.anyRoom')}</MenuItem>
                                {typesSalle.map((type) => (
                                    <MenuItem key={type} value={type}>
                                        {t(`ref.roomTypes.${type}`, { defaultValue: type })}
                                    </MenuItem>
                                ))}
                            </TextField>
                        )}
                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                {t('ref.curriculum.compFields.rhythm')}
                            </Typography>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField fullWidth type="number" label={t('ref.curriculum.compFields.weekStart')} value={etat.form.semaine_debut} onChange={champ('semaine_debut')} inputProps={{ min: 1, max: 30 }} />
                                <TextField fullWidth type="number" label={t('ref.curriculum.compFields.weekEnd')} value={etat.form.semaine_fin} onChange={champ('semaine_fin')} inputProps={{ min: 1, max: 30 }} />
                                <TextField fullWidth type="number" label={t('ref.curriculum.compFields.perWeek')} value={etat.form.seances_par_semaine} onChange={champ('seances_par_semaine')} inputProps={{ min: 1, max: 20 }} />
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                                {t('ref.curriculum.compFields.rhythmHelp')}
                            </Typography>
                        </Box>
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
