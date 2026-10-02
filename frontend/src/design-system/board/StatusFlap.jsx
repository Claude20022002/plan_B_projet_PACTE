import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ds } from '../tokens';
import FlapText from './FlapText';

/**
 * Statut d'une séance, rendu comme un volet du panneau.
 * variant « board » : lettres de couleur sur le noir du panneau ;
 * variant « bureau » : pastille claire pour les écrans de gestion.
 */
export default function StatusFlap({ status, variant = 'board', phase }) {
  const { t } = useTranslation();
  const tone = ds.status[status] || ds.status.planifie;

  // La séance en vedette affiche « En cours » / « Prochaine » tant qu'elle n'est ni reportée ni annulée
  const showPhase = phase && (status === 'planifie' || status === 'confirme');
  const label = showPhase ? t(`status.${phase}`) : t(`status.${status}`, { defaultValue: status });
  const boardColor = showPhase ? ds.board.live : tone.board;

  if (variant === 'bureau') {
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 1,
          height: 24,
          borderRadius: `${ds.radius.xs}px`,
          bgcolor: tone.bureauBg,
          color: tone.bureau,
          fontFamily: ds.font.board,
          fontWeight: 600,
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        <FlapText value={label} />
      </Box>
    );
  }

  return (
    <Box
      component="span"
      sx={{
        fontFamily: ds.font.board,
        fontWeight: 600,
        fontSize: 'inherit',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: boardColor,
        whiteSpace: 'nowrap',
      }}
    >
      <FlapText value={label} />
    </Box>
  );
}
