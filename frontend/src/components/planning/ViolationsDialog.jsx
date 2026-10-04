import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import StateChip from '../../design-system/components/StateChip';

/**
 * Réponse 409 d'une séance : les règles enfreintes (bloquantes d'abord, puis avertissements).
 * L'administration peut forcer l'enregistrement en le justifiant (`onForcer(justification)`),
 * ce que le serveur trace dans l'historique ; sinon on revient corriger.
 */
export default function ViolationsDialog({ violations, onClose, onForcer }) {
    const { t } = useTranslation();
    const [justification, setJustification] = useState('');
    const [envoi, setEnvoi] = useState(false);
    const liste = violations ?? [];
    const bloquantes = liste.filter((v) => v.bloquant);
    const avertissements = liste.filter((v) => !v.bloquant);

    const fermer = () => {
        setJustification('');
        onClose();
    };

    const forcer = async () => {
        setEnvoi(true);
        try {
            await onForcer(justification.trim());
            setJustification('');
        } finally {
            setEnvoi(false);
        }
    };

    return (
        <Dialog open={liste.length > 0} onClose={fermer} maxWidth="sm" fullWidth>
            <DialogTitle>
                {t('rules.title')}
                <Typography variant="body2" color="text.secondary">
                    {t('rules.intro', { count: bloquantes.length })}
                </Typography>
            </DialogTitle>
            <DialogContent>
                <Section t={t} titre={t('rules.blocking')} items={bloquantes} ton="danger" />
                <Section t={t} titre={t('rules.warnings')} items={avertissements} ton="warning" />
                {onForcer && bloquantes.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {t('rules.forceTitle')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                            {t('rules.forceHelp')}
                        </Typography>
                        <TextField label={t('rules.justification')} value={justification} onChange={(e) => setJustification(e.target.value)} multiline minRows={2} fullWidth />
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={fermer}>{t('rules.fix')}</Button>
                {onForcer && bloquantes.length > 0 && (
                    <Button variant="contained" color="warning" onClick={forcer} disabled={!justification.trim() || envoi}>
                        {t('rules.force')}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}

function Section({ t, titre, items, ton }) {
    if (items.length === 0) return null;
    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                {titre}
            </Typography>
            <Box component="ul" sx={{ m: 0, mt: 0.5, p: 0, listStyle: 'none', borderTop: '1px solid', borderColor: 'divider' }}>
                {items.map((v, i) => (
                    <Box component="li" key={`${v.code}-${i}`} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <StateChip tone={ton}>{t(`rules.codes.${v.code}`, { defaultValue: v.code })}</StateChip>
                        <Typography variant="body2" sx={{ pt: 0.25 }}>
                            {v.message}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
