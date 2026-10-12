import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

/** Fenêtre de confirmation de la date d'une fête lunaire. */
export default function ConfirmationDialog({ etat, setEtat, onSubmit }) {
    const { t } = useTranslation();
    const fermer = () => setEtat({ open: false, evenement: null, date_debut: '', date_fin: '' });

    return (
        <Dialog open={etat.open} onClose={() => fermer()} maxWidth="xs" fullWidth>
            <form onSubmit={onSubmit}>
                <DialogTitle>{t('ref.calendar.confirmTitle', { name: etat.evenement?.titre })}</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {t('ref.calendar.confirmIntro')}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                        <TextField fullWidth type="date" label={t('ref.calendar.fields.start')} value={etat.date_debut} onChange={(e) => setEtat((c) => ({ ...c, date_debut: e.target.value }))} InputLabelProps={{ shrink: true }} required />
                        <TextField fullWidth type="date" label={t('ref.calendar.fields.end')} value={etat.date_fin} onChange={(e) => setEtat((c) => ({ ...c, date_fin: e.target.value }))} InputLabelProps={{ shrink: true }} required />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => fermer()}>{t('common.cancel')}</Button>
                    <Button type="submit" variant="contained">
                        {t('ref.calendar.confirm')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
