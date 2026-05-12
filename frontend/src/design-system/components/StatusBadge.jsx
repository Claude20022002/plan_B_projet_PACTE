import { Chip } from '@mui/material';

const toneByStatus = {
  planifie: { label: 'Planifié', color: 'default' },
  confirme: { label: 'Confirmé', color: 'success' },
  annule: { label: 'Annulé', color: 'error' },
  reporte: { label: 'Reporté', color: 'warning' },
  active: { label: 'Actif', color: 'success' },
  conflict: { label: 'Conflit', color: 'error' },
};

export default function StatusBadge({ status, label }) {
  const meta = toneByStatus[status] || { label: label || status, color: 'default' };
  return (
    <Chip
      size="small"
      label={label || meta.label}
      color={meta.color}
      variant={meta.color === 'default' ? 'outlined' : 'filled'}
      sx={{ height: 24, fontWeight: 700 }}
    />
  );
}

