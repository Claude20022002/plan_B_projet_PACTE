/**
 * PageSkeleton.jsx — Fallback Suspense pour les pages authentifiées.
 * Imite le DashboardLayout pour éviter le flash de layout.
 *
 * Props :
 *   hint?: string — texte optionnel sous le spinner (ex: "Chargement du calendrier...")
 */

import { Box, Skeleton, LinearProgress, Typography } from '@mui/material';

const DRAWER_W = 260;

export default function PageSkeleton({ hint }) {
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Sidebar skeleton ─────────────────────────────────────────── */}
      <Box
        sx={{
          width: DRAWER_W, flexShrink: 0,
          bgcolor: 'background.paper',
          borderRight: '1px solid',
          borderColor: 'divider',
          display: { xs: 'none', sm: 'flex' },
          flexDirection: 'column',
          p: 2, gap: 1,
        }}
      >
        {/* Logo */}
        <Skeleton variant="rectangular" height={64} sx={{ borderRadius: 2, mb: 1 }} />
        {/* Menu items */}
        {[100, 85, 90, 75, 95, 80, 70].map((w, i) => (
          <Skeleton key={i} variant="text" width={`${w}%`} height={36} sx={{ borderRadius: 1 }} />
        ))}
      </Box>

      {/* ── Main area skeleton ───────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* AppBar */}
        <Box sx={{
          height: 64, bgcolor: 'primary.main',
          display: 'flex', alignItems: 'center', px: 3, gap: 2,
        }}>
          <Skeleton variant="rectangular" width={140} height={36}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }} />
          <Box sx={{ flex: 1 }} />
          <Skeleton variant="circular" width={36} height={36}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
          <Skeleton variant="circular" width={36} height={36}
            sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
        </Box>

        {/* Loading indicator */}
        <LinearProgress sx={{ height: 2 }} />

        {/* Content */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          {/* Header de page */}
          <Skeleton variant="text" width={220} height={40} sx={{ mb: 3 }} />

          {/* KPI cards */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" sx={{ flex: 1, height: 100, borderRadius: 2 }} />
            ))}
          </Box>

          {/* Table */}
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />

          {hint && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">{hint}</Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
