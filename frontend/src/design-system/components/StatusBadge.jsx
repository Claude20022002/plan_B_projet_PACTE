import { Chip } from '@mui/material';
import PastilleEtat from '../cartes/PastilleEtat';

const SESSION_STATUSES = new Set(['planifie', 'confirme', 'annule', 'reporte', 'realise']);

const otherTones = {
  active: { label: 'Actif', color: 'success' },
  conflict: { label: 'Conflit', color: 'error' },
};

/**
 * Pastille de statut. Les statuts de séance passent par la pastille d'état des cartes
 * (même vocabulaire, mêmes couleurs et même traduction sur tous les écrans).
 */
export default function StatusBadge({ status, label }) {
  if (SESSION_STATUSES.has(status) && !label) {
    return <PastilleEtat status={status} />;
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
