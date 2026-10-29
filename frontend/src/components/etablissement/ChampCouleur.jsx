import { useTranslation } from 'react-i18next';
import { Box, Stack, TextField, Typography } from '@mui/material';
import { verifierCouleur } from '../../../../shared/couleurs.js';

/**
 * Une couleur de l'école : nuancier du navigateur et saisie #RRGGBB, avec le contrôle de
 * lisibilité commun au serveur (shared/couleurs.js) affiché pendant la saisie. Le serveur refuse
 * de toute façon une couleur illisible.
 */
export default function ChampCouleur({ libelle, aide, usage, valeur, onChange }) {
  const { t, i18n } = useTranslation();
  const verdict = verifierCouleur(valeur, usage);
  const nuancier = verdict.contraste === null ? '#000000' : valeur;

  return (
    <Box>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box
          component="input"
          type="color"
          value={nuancier}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          aria-label={libelle}
          sx={{ width: 48, height: 40, p: 0.25, border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper', cursor: 'pointer', flexShrink: 0 }}
        />
        <TextField
          label={libelle}
          value={valeur}
          onChange={(e) => onChange(e.target.value.trim().toUpperCase())}
          error={!verdict.valide}
          helperText={verdict.valide ? aide : verdict.message}
          inputProps={{ maxLength: 7, spellCheck: false }}
          sx={{ width: { xs: '100%', sm: 360 } }}
        />
      </Stack>
      {/* Refusée : le message d'erreur sous le champ dit déjà pourquoi */}
      {verdict.valide && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, ml: 7.5, color: 'success.main' }}>
          {t('etablissement.contraste', { valeur: verdict.contraste.toLocaleString(i18n.language), seuil: verdict.seuil.toLocaleString(i18n.language) })}
        </Typography>
      )}
    </Box>
  );
}
