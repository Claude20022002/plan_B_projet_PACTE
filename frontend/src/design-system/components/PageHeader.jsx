import { Box, Button, Stack, Typography } from '@mui/material';

/**
 * En-tête de page de gestion : titre, phrase d'aide facultative, actions.
 * Pas de surtitre : le titre porte seul la hiérarchie (la prop `eyebrow` est ignorée).
 */
export default function PageHeader({ title, subtitle, actions = [] }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
        mb: 3,
        flexDirection: { xs: 'column', sm: 'row' },
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h1" component="h2">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions.length > 0 && (
        <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
          {actions.map((action) => (
            <Button
              key={action.label}
              {...Object.fromEntries(Object.entries(action).filter(([key]) => key !== 'label'))}
              sx={{ whiteSpace: 'nowrap', ...action.sx }}
            >
              {action.label}
            </Button>
          ))}
        </Stack>
      )}
    </Box>
  );
}
