import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Stack,
    TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { PERIODE_VIDE } from './constantes';

/** Fenêtre de création et de modification d'un semestre. */
export default function PeriodeDialog({ etat, setEtat, onSubmit }) {
    const { t } = useTranslation();
    const fermer = () => setEtat({ open: false, editing: null, form: PERIODE_VIDE });

    return (
        <Dialog open={etat.open} onClose={() => fermer()} maxWidth="xs" fullWidth>
            <form onSubmit={onSubmit}>
                <DialogTitle>{etat.editing ? t('ref.calendar.editSemester') : t('ref.calendar.addSemester')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Stack direction="row" spacing={2}>
                            <TextField select fullWidth label={t('ref.calendar.fields.code')} value={etat.form.code} onChange={(e) => setEtat((d) => ({ ...d, form: { ...d.form, code: e.target.value } }))}>
                                <MenuItem value="S1">S1</MenuItem>
                                <MenuItem value="S2">S2</MenuItem>
                            </TextField>
                            <TextField fullWidth type="number" label={t('ref.calendar.fields.weeks')} value={etat.form.nb_semaines} onChange={(e) => setEtat((d) => ({ ...d, form: { ...d.form, nb_semaines: e.target.value } }))} inputProps={{ min: 1, max: 30 }} required />
                        </Stack>
                        <TextField label={t('ref.calendar.fields.semesterLabel')} value={etat.form.libelle} onChange={(e) => setEtat((d) => ({ ...d, form: { ...d.form, libelle: e.target.value } }))} />
                        <Stack direction="row" spacing={2}>
                            <TextField fullWidth type="date" label={t('ref.calendar.fields.start')} value={etat.form.date_debut} onChange={(e) => setEtat((d) => ({ ...d, form: { ...d.form, date_debut: e.target.value } }))} InputLabelProps={{ shrink: true }} required />
                            <TextField fullWidth type="date" label={t('ref.calendar.fields.end')} value={etat.form.date_fin} onChange={(e) => setEtat((d) => ({ ...d, form: { ...d.form, date_fin: e.target.value } }))} InputLabelProps={{ shrink: true }} required />
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
