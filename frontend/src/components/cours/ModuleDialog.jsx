import { Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { MODULE_VIDE, SEMESTRES, TYPES } from './constantes';

/** Fenêtre de création et de modification d'un module de la maquette. */
export default function ModuleDialog({ etat, setEtat, filieres, enseignants, onSubmit }) {
    const { t } = useTranslation();
    const champ = (nom) => (e) => setEtat((d) => ({ ...d, form: { ...d.form, [nom]: e.target.value } }));
    const fermer = () => setEtat({ open: false, editing: null, form: MODULE_VIDE });

    return (
        <Dialog open={etat.open} onClose={() => fermer()} maxWidth="sm" fullWidth>
            <form onSubmit={onSubmit}>
                <DialogTitle>{etat.editing ? t('ref.curriculum.editModule') : t('ref.curriculum.addModule')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField label={t('ref.curriculum.fields.code')} value={etat.form.code_cours} onChange={champ('code_cours')} required autoFocus sx={{ minWidth: 180 }} />
                            <TextField fullWidth label={t('ref.curriculum.fields.name')} value={etat.form.nom_cours} onChange={champ('nom_cours')} required />
                        </Stack>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField select fullWidth label={t('ref.curriculum.fields.program')} value={etat.form.id_filiere} onChange={champ('id_filiere')} required>
                                {filieres.map((f) => (
                                    <MenuItem key={f.id_filiere} value={f.id_filiere}>
                                        {f.code_filiere} · {f.nom_filiere}
                                    </MenuItem>
                                ))}
                            </TextField>
                            <TextField fullWidth label={t('ref.curriculum.fields.level')} value={etat.form.niveau} onChange={champ('niveau')} placeholder="4ème année" required />
                            <TextField select label={t('ref.curriculum.fields.semester')} value={etat.form.semestre} onChange={champ('semestre')} sx={{ minWidth: 110 }}>
                                {SEMESTRES.map((s) => (
                                    <MenuItem key={s} value={s}>
                                        {s}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Stack>
                        {!etat.editing && (
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                                <TextField select fullWidth label={t('ref.curriculum.fields.firstComponent')} value={etat.form.type_cours} onChange={champ('type_cours')}>
                                    {TYPES.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField fullWidth type="number" label={t('ref.curriculum.fields.volume')} value={etat.form.volume_horaire} onChange={champ('volume_horaire')} inputProps={{ min: 1 }} required />
                            </Stack>
                        )}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField fullWidth type="number" label={t('ref.curriculum.fields.ects')} value={etat.form.ects} onChange={champ('ects')} inputProps={{ min: 0, step: 0.5 }} />
                            <TextField fullWidth type="number" label={t('ref.curriculum.fields.coefficient')} value={etat.form.coefficient} onChange={champ('coefficient')} inputProps={{ min: 0, step: 0.5 }} />
                            <TextField select fullWidth label={t('ref.curriculum.fields.lead')} value={etat.form.id_responsable} onChange={champ('id_responsable')}>
                                <MenuItem value="">{t('common.aucun')}</MenuItem>
                                {enseignants.map((e) => (
                                    <MenuItem key={e.id_user} value={e.id_user}>
                                        {e.user?.prenom} {e.user?.nom}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Stack>
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
