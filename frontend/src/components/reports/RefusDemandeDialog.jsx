import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material';
import { WarningAmber } from '@mui/icons-material';
import { dateCourte } from './format';

/**
 * Refus d'une demande de report (administration). Il se confirme, car l'enseignant est prévenu
 * aussitôt et la décision ne s'annule pas (M-5) ; la raison, facultative, part avec la
 * notification du refus et reste lisible dans sa liste de demandes.
 * `onRefuser(raison)` : raison saisie, sans espaces autour (chaîne vide si aucune).
 */
export default function RefusDemandeDialog({ demande, onClose, onRefuser }) {
    const { t, i18n } = useTranslation();
    const [raison, setRaison] = useState('');

    // Chaque demande part d'un champ vide : une raison écrite pour une autre ne doit pas la suivre
    useEffect(() => {
        setRaison('');
    }, [demande?.id_demande]);

    const envoyer = (e) => {
        e.preventDefault();
        onRefuser(raison.trim());
    };

    return (
        <Dialog open={Boolean(demande)} onClose={onClose} maxWidth="xs" fullWidth>
            {demande && (
                <Box component="form" onSubmit={envoyer}>
                    <DialogTitle>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WarningAmber color="warning" />
                            {t('reportsAdmin.refusTitre')}
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {t('reportsAdmin.refusMessage', {
                                enseignant: [demande.enseignant?.prenom, demande.enseignant?.nom].filter(Boolean).join(' '),
                                seance: demande.affectation?.cours?.nom_cours ?? '',
                                date: dateCourte(demande.nouvelle_date, i18n.language),
                            })}
                        </DialogContentText>
                        <TextField
                            label={t('reportsAdmin.refusRaison')}
                            helperText={t('reportsAdmin.refusRaisonAide')}
                            value={raison}
                            onChange={(e) => setRaison(e.target.value)}
                            multiline
                            minRows={2}
                            fullWidth
                            margin="normal"
                            slotProps={{ htmlInput: { maxLength: 500 } }}
                        />
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={onClose} variant="outlined">
                            {t('common.cancel')}
                        </Button>
                        <Button type="submit" color="error" variant="contained">
                            {t('reportsAdmin.refuser')}
                        </Button>
                    </DialogActions>
                </Box>
            )}
        </Dialog>
    );
}
