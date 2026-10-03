import { Chip } from '@mui/material';
import StatusFlap from '../board/StatusFlap';

const SESSION_STATUSES = new Set(['planifie', 'confirme', 'annule', 'reporte']);

const otherTones = {
  active: { label: 'Actif', color: 'success' },
  conflict: { label: 'Conflit', color: 'error' },
};

/**
 * Pastille de statut. Les statuts de séance passent par le volet du panneau
 * (même vocabulaire, mêmes couleurs et même traduction sur tous les écrans).
 */
export default function StatusBadge({ status, label }) {
  if (SESSION_STATUSES.has(status) && !label) {
    return <StatusFlap status={status} variant="bureau" />;
  }
  const meta = otherTones[status] || { label: label || status, color: 'default' };
  return (
    <Chip
      size="small"
      label={label || meta.label}
      color={meta.color}
      variant={meta.color === 'default' ? 'outlined' : 'filled'}
    />
  );
}
