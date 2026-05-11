import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 2 }}>
      <Typography variant="h1" fontWeight={900} color="primary.main" sx={{ fontSize: { xs: '5rem', sm: '8rem' }, lineHeight: 1 }}>
        404
      </Typography>
      <Typography variant="h5" color="text.secondary" fontWeight={600}>Page introuvable</Typography>
      <Typography color="text.disabled">Cette page n'existe pas ou a été déplacée.</Typography>
      <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
        <Button variant="outlined" onClick={() => navigate(-1)}>Retour</Button>
        <Button variant="contained" onClick={() => navigate('/')}>Accueil</Button>
      </Box>
    </Box>
  );
}
