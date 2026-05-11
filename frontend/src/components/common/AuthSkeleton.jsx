/**
 * AuthSkeleton.jsx — Fallback Suspense pour les pages publiques (connexion, reset...).
 * Skeleton minimal centré — la page publique est légère.
 */

import { Box, Skeleton, CircularProgress } from '@mui/material';

export default function AuthSkeleton() {
  return (
    <Box sx={{
      display: 'flex', height: '100vh', width: '100%',
      bgcolor: 'background.default',
    }}>
      {/* Colonne image gauche */}
      <Box sx={{
        width: { xs: 0, sm: '40%' },
        display: { xs: 'none', sm: 'block' },
      }}>
        <Skeleton variant="rectangular" width="100%" height="100%" />
      </Box>

      {/* Formulaire droite */}
      <Box sx={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        p: 6, gap: 2,
      }}>
        <Skeleton variant="rectangular" width={200} height={50} sx={{ borderRadius: 1, mb: 2 }} />
        <Skeleton variant="text" width={240} height={36} />
        <Skeleton variant="text" width={300} height={22} />
        <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1, mt: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width="100%" height={52} sx={{ borderRadius: 2, mt: 2 }} />
        <CircularProgress size={20} sx={{ mt: 1 }} />
      </Box>
    </Box>
  );
}
