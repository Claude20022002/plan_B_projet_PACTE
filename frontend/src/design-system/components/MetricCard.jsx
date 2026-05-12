import { Box, Paper, Typography } from '@mui/material';
import { motion } from 'motion/react';

const MotionPaper = motion(Paper);

export default function MetricCard({ label, value, helper, icon, tone = 'primary', trend, onClick }) {
  const colorMap = {
    primary: 'primary.main',
    success: 'success.main',
    warning: 'warning.main',
    danger: 'error.main',
    neutral: 'text.secondary',
  };

  return (
    <MotionPaper
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -2 } : undefined}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      sx={{
        p: 2,
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>
            {label}
          </Typography>
          <Typography variant="h2" sx={{ mt: 0.75 }}>
            {value}
          </Typography>
          {helper && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
              {helper}
            </Typography>
          )}
        </Box>
        {icon && (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              bgcolor: 'action.hover',
              color: colorMap[tone],
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
      {trend && (
        <Typography variant="caption" color={trend.startsWith('+') ? 'success.main' : 'text.secondary'} sx={{ mt: 1, display: 'block' }}>
          {trend}
        </Typography>
      )}
    </MotionPaper>
  );
}

