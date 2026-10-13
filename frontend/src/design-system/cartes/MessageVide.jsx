import { Box, Typography } from '@mui/material';

/** Message d'une liste vide dans une carte : un titre, une phrase d'explication et une action facultative. */
export default function MessageVide({ titre, texte, action }) {
  return (
    <Box sx={{ maxWidth: 520 }}>
      <Typography component="p" sx={{ fontWeight: 600, fontSize: '1.0625rem' }}>
        {titre}
      </Typography>
      {texte && (
        <Typography component="p" sx={{ mt: 0.75, color: 'text.secondary' }}>
          {texte}
        </Typography>
      )}
      {action && <Box sx={{ mt: 2 }}>{action}</Box>}
    </Box>
  );
}
