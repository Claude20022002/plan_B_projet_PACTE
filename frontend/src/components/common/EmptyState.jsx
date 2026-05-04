import { Box, Typography, Button } from '@mui/material';
import { Inbox } from '@mui/icons-material';

/**
 * État vide illustré pour les tableaux sans données.
 * Props :
 *   title        string   titre principal
 *   description  string   texte secondaire
 *   actionLabel  string   label du bouton CTA
 *   onAction     fn       callback du bouton CTA
 *   icon         Component icône MUI (défaut : Inbox)
 */
export default function EmptyState({
    title = 'Aucun élément',
    description = 'Commencez par créer un premier enregistrement.',
    actionLabel,
    onAction,
    icon: Icon = Inbox,
}) {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 8,
                px: 2,
                bgcolor: 'background.paper',
                borderRadius: 1,
            }}
        >
            <Icon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom fontWeight={600}>
                {title}
            </Typography>
            {description && (
                <Typography
                    variant="body2"
                    color="text.disabled"
                    align="center"
                    sx={{ maxWidth: 380, mb: actionLabel ? 3 : 0 }}
                >
                    {description}
                </Typography>
            )}
            {actionLabel && onAction && (
                <Button variant="contained" onClick={onAction} sx={{ mt: 1 }}>
                    {actionLabel}
                </Button>
            )}
        </Box>
    );
}
