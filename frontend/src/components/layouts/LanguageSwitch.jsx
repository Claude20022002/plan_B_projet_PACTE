import { useTranslation } from 'react-i18next';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { LANGUAGES } from '../../i18n';
import { ds } from '../../design-system/tokens';

/** Choix de la langue (FR / EN) du menu ; `onDark` : sur le fond sombre du menu latéral. */
export default function LanguageSwitch({ onDark = false }) {
  const { i18n, t } = useTranslation();
  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={i18n.language}
      onChange={(_, value) => value && i18n.changeLanguage(value)}
      aria-label={t('common.language')}
      sx={{
        '& .MuiToggleButton-root': {
          fontFamily: ds.font.board,
          fontWeight: 600,
          letterSpacing: '0.08em',
          px: 1.25,
          py: 0.25,
          lineHeight: 1.6,
          color: onDark ? ds.nav.letterDim : 'text.secondary',
          borderColor: onDark ? ds.nav.bordBouton : 'divider',
          '&.Mui-selected': {
            color: onDark ? ds.nav.letter : 'primary.main',
            bgcolor: onDark ? ds.nav.boutonActif : 'action.selected',
          },
        },
      }}
    >
      {LANGUAGES.map((lang) => (
        <ToggleButton key={lang.code} value={lang.code} aria-label={lang.label}>
          {lang.short}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
