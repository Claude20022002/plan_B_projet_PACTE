import { useTranslation } from 'react-i18next';
import { Box, Chip, ListItem, Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { ReportProblemOutlined } from '@mui/icons-material';

/**
 * Un étudiant de la liste d'appel : son nom, comment sa présence a été notée, et trois boutons
 * (présent, en retard, absent) toujours visibles : un seul geste, sur ordinateur comme au téléphone.
 * Pas de statut « excusé » (décision du 15 octobre 2026).
 */
const STATUTS = [
  { valeur: 'present', couleur: 'success' },
  { valeur: 'retard', couleur: 'warning' },
  { valeur: 'absent', couleur: 'error' },
];

export default function LigneAppel({ etudiant, onStatut, libelleSignalement }) {
  const { t } = useTranslation();
  const statut = etudiant.statut ?? (etudiant.present ? 'present' : 'absent');
  const details = statut !== 'absent'
    ? [t(etudiant.source === 'manuel' ? 'appel.coche' : 'appel.scanne'), etudiant.verifie && t('appel.verifie'), etudiant.motif].filter(Boolean).join(' · ')
    : null;

  return (
    <ListItem disablePadding sx={{ py: 0.75, gap: 1.5, flexWrap: 'wrap', borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ flex: '1 1 180px', minWidth: 0 }}>
        <Typography sx={{ fontWeight: 500 }}>{`${etudiant.nom} ${etudiant.prenom}`}</Typography>
        {details && <Typography variant="body2" color="text.secondary">{details}</Typography>}
        {etudiant.signalements?.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }} aria-label={t('appel.signalements')}>
            {etudiant.signalements.map((s) => (
              <Chip key={`${s.motif}-${s.lie}`} size="small" color="warning" variant="outlined" icon={<ReportProblemOutlined />} label={libelleSignalement(s)} />
            ))}
          </Stack>
        )}
      </Box>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={statut}
        onChange={(_, valeur) => valeur && valeur !== statut && onStatut(etudiant, valeur)}
        aria-label={t('appel.statutDe', { nom: `${etudiant.prenom} ${etudiant.nom}` })}
      >
        {STATUTS.map(({ valeur, couleur }) => (
          <ToggleButton key={valeur} value={valeur} color={couleur} sx={{ textTransform: 'none', px: 1.5, minWidth: 84 }}>
            {t(`appel.statuts.${valeur}`)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </ListItem>
  );
}
