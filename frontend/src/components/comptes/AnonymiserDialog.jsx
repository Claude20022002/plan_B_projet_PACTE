import React, { useEffect, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material';
import { WarningAmber } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const MOT = 'ANONYMISER';
const norme = (s) => s.trim().toLocaleLowerCase();

/**
 * Anonymisation d'un compte désactivé (lot ME-17) : irréversible, donc le bouton ne s'active qu'une
 * fois le nom du compte (« Prénom Nom ») ou le mot ANONYMISER saisi.
 */
export default function AnonymiserDialog({ compte, onConfirm, onCancel }) {
    const { t } = useTranslation();
    const [saisie, setSaisie] = useState('');
    useEffect(() => { setSaisie(''); }, [compte]);

    const nom = compte ? `${compte.prenom} ${compte.nom}` : '';
    const valide = [nom, MOT].some((attendu) => norme(saisie) === norme(attendu));

    return (
        <Dialog open={Boolean(compte)} onClose={onCancel} maxWidth="xs" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmber color="warning" />
                    {t('comptes.anonymiserTitre')}
                </Box>
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>{t('comptes.anonymiserMessage', { nom })}</DialogContentText>
                <TextField
                    autoFocus
                    fullWidth
                    size="small"
                    label={t('comptes.anonymiserSaisie', { nom, mot: MOT })}
                    value={saisie}
                    onChange={(e) => setSaisie(e.target.value)}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button variant="outlined" onClick={onCancel}>{t('common.cancel')}</Button>
                <Button variant="contained" color="error" disabled={!valide} onClick={onConfirm}>{t('comptes.anonymiser')}</Button>
            </DialogActions>
        </Dialog>
    );
}
