import { useTranslation } from 'react-i18next';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import RechercheCreneaux from './RechercheCreneaux';

/**
 * Assistant de créneaux (innovation I8) dans une fenêtre : la recherche de RechercheCreneaux,
 * relancée à chaque ouverture (le contenu de la fenêtre est recréé), et un bouton pour fermer.
 */
export default function AssistantCreneauxDialog({ open, titre, sousTitre, onClose, chercher, onChoisir, libelleChoix, plageInitiale }) {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {titre}
                {sousTitre && (
                    <Typography variant="body2" color="text.secondary">
                        {sousTitre}
                    </Typography>
                )}
            </DialogTitle>
            <DialogContent>
                <RechercheCreneaux chercher={chercher} onChoisir={onChoisir} libelleChoix={libelleChoix} plageInitiale={plageInitiale} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>{t('common.close')}</Button>
            </DialogActions>
        </Dialog>
    );
}
