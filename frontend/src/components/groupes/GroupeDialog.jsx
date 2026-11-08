import { useTranslation } from 'react-i18next';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';

/**
 * Dialogue de création ou de modification d'un groupe (promotion, TD ou TP). Pas de campus : les
 * salles se répartissent selon l'effectif, la capacité et la disponibilité (décision du 21 octobre 2026).
 */
export default function GroupeDialog({ dialog, onChange, onClose, onSubmit }) {
    const { t } = useTranslation();
    const { form } = dialog;
    const champ = (nom) => (e) => onChange(nom, e.target.value);
    return (
        <Dialog open={dialog.open} onClose={onClose} maxWidth="sm" fullWidth>
            <form onSubmit={onSubmit}>
                <DialogTitle>{dialog.editing ? t('ref.groups.edit') : t(`ref.groups.create.${form.type_groupe}`)}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField label={t('ref.groups.fields.name')} value={form.nom_groupe} onChange={champ('nom_groupe')} helperText={t('ref.groups.fields.nameHelp')} required autoFocus />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField fullWidth label={t('ref.groups.fields.level')} value={form.niveau} onChange={champ('niveau')} placeholder="4ème année" required />
                            <TextField type="number" label={t('ref.groups.fields.year')} value={form.annee} onChange={champ('annee')} inputProps={{ min: 1, max: 6 }} sx={{ minWidth: 130 }} />
                            <TextField type="number" label={t('ref.groups.fields.size')} value={form.effectif} onChange={champ('effectif')} inputProps={{ min: 0 }} sx={{ minWidth: 120 }} />
                        </Stack>
                        <TextField label={t('ref.groups.fields.schoolYear')} value={form.annee_scolaire} onChange={champ('annee_scolaire')} placeholder="2026-2027" required />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>{t('common.cancel')}</Button>
                    <Button type="submit" variant="contained">
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
