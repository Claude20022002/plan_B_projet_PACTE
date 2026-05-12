import { Box, Button, Stack, Typography } from '@mui/material';
import { motion } from 'motion/react';

const MotionBox = motion(Box);

export default function PageHeader({ title, subtitle, eyebrow, actions = [] }) {
  return (
    <MotionBox
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
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
        {eyebrow && (
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
            {eyebrow}
          </Typography>
        )}
        <Typography variant="h1" sx={{ mt: eyebrow ? 0.25 : 0 }}>
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
    </MotionBox>
  );
}
