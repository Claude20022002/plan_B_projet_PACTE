import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Box } from '@mui/material';
import { WarningAmber } from '@mui/icons-material';

/**
 * Dialog de confirmation MUI — remplace window.confirm()
 * Props :
 *   open         bool
 *   title        string
 *   message      string
 *   onConfirm    fn
 *   onCancel     fn
 *   confirmLabel string  (défaut : "Supprimer")
 *   confirmColor string  (défaut : "error")
 */
export default function ConfirmDialog({
    open,
    title = 'Confirmation',
    message = 'Cette action est irréversible.',
    onConfirm,
    onCancel,
    confirmLabel = 'Supprimer',
    confirmColor = 'error',
}) {
    return (
        <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningAmber color="warning" />
                    {title}
                </Box>
            </DialogTitle>
            <DialogContent>
                <DialogContentText>{message}</DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onCancel} variant="outlined">
                    Annuler
                </Button>
                <Button onClick={onConfirm} color={confirmColor} variant="contained" autoFocus>
                    {confirmLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
