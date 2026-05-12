import { Box, Grid, Skeleton, Stack } from '@mui/material';

export function MetricSkeleton({ count = 4 }) {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid key={index} size={{ xs: 6, md: 3 }}>
          <Skeleton variant="rounded" height={112} sx={{ borderRadius: 2 }} />
        </Grid>
      ))}
    </Grid>
  );
}

export function TableSkeleton({ rows = 8 }) {
  return (
    <Stack spacing={1}>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={48} sx={{ borderRadius: 1.5 }} />
      ))}
    </Stack>
  );
}

export default function PremiumSkeleton() {
  return (
    <Box>
      <Skeleton variant="rounded" width={260} height={32} sx={{ mb: 1 }} />
      <Skeleton variant="rounded" width="45%" height={18} sx={{ mb: 3 }} />
      <MetricSkeleton />
      <Box sx={{ mt: 3 }}>
        <TableSkeleton />
      </Box>
    </Box>
  );
}

