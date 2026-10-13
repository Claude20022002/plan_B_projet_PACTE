import { Box, useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { ds } from '../tokens';

/**
 * État d'une séance en pastille ronde (DESIGN.md, Pastilles d'état) : valeur « bureau » sur son
 * fond pâle en clair, valeur éclaircie sur un voile la nuit. La séance en vedette affiche « En cours »
 * ou « Prochaine » tant qu'elle n'est ni reportée ni annulée.
 */
export default function PastilleEtat({ status, phase }) {
  const { t } = useTranslation();
  const nuit = useTheme().palette.mode === 'dark';
  const enVedette = phase && (status === 'planifie' || status === 'confirme');
  const ton = ds.status[enVedette ? 'confirme' : status] || ds.status.planifie;
  const libelle = enVedette ? t(`status.${phase}`) : t(`status.${status}`, { defaultValue: status });

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        height: 24,
        borderRadius: 999,
        bgcolor: nuit ? 'rgba(241, 245, 249, 0.08)' : ton.bureauBg,
        color: nuit ? ton.board : ton.bureau,
        fontFamily: ds.font.board,
        fontWeight: 600,
        fontSize: '0.75rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {enVedette && <Box component="span" aria-hidden="true" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'currentColor' }} />}
      {libelle}
    </Box>
  );
}
