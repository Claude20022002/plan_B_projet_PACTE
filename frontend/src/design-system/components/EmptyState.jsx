import { Box, Button, Paper, Typography } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';
import { motion } from 'motion/react';

const MotionPaper = motion(Paper);

export default function EmptyState({ title, description, actionLabel, onAction, icon }) {
  return (
    <MotionPaper
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      sx={{
        p: { xs: 3, sm: 4 },
        textAlign: 'center',
        border: '1px dashed',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: 2,
          mx: 'auto',
          mb: 2,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'action.hover',
          color: 'primary.main',
        }}
      >
        {icon || <InboxOutlined />}
      </Box>
      <Typography variant="h2">{title}</Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440, mx: 'auto', mt: 1 }}>
          {description}
        </Typography>
      )}
      {actionLabel && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 2 }}>
          {actionLabel}
        </Button>
      )}
    </MotionPaper>
  );
}

