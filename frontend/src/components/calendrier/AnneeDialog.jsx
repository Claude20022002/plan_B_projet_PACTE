import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    Stack,
    Switch,
    TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ANNEE_VIDE } from './constantes';

/** Fenêtre de création et de modification d'une année universitaire. */
export default function AnneeDialog({ etat, setEtat, onSubmit }) {
    const { t } = useTranslation();
    const fermer = () => setEtat({ open: false, editing: null, form: ANNEE_VIDE });

    return (
        <Dialog open={etat.open} onClose={() => fermer()} maxWidth="xs" fullWidth>
            <form onSubmit={onSubmit}>
                <DialogTitle>{etat.editing ? t('ref.calendar.editYear') : t('ref.calendar.newYear')}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label={t('ref.calendar.fields.label')}
                            value={etat.form.libelle}
                            onChange={(e) => setEtat((d) => ({ ...d, form: { ...d.form, libelle: e.target.value } }))}
                            helperText={t('ref.calendar.fields.labelHelp')}
                            inputProps={{ pattern: '\\d{4}-\\d{4}' }}
                            required
                            autoFocus
                        />
                        <Stack direction="row" spacing={2}>
                            <TextField fullWidth type="date" label={t('ref.calendar.fields.start')} value={etat.form.date_debut} onChange={(e) => setEtat((d) => ({ ...d, form: { ...d.form, date_debut: e.target.value } }))} InputLabelProps={{ shrink: true }} required />
                            <TextField fullWidth type="date" label={t('ref.calendar.fields.end')} value={etat.form.date_fin} onChange={(e) => setEtat((d) => ({ ...d, form: { ...d.form, date_fin: e.target.value } }))} InputLabelProps={{ shrink: true }} required />
                        </Stack>
                        <FormControlLabel
                            control={<Switch checked={etat.form.active} onChange={(e) => setEtat((d) => ({ ...d, form: { ...d.form, active: e.target.checked } }))} />}
                            label={t('ref.calendar.fields.active')}
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
