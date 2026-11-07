import { useTranslation } from 'react-i18next';
import { Avatar, Box, IconButton, Tooltip, Typography } from '@mui/material';
import { DarkModeOutlined, LightModeOutlined, Logout } from '@mui/icons-material';
import LanguageSwitch from './LanguageSwitch';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ds } from '../../design-system/tokens';

/**
 * Pied du menu latéral : le compte (vers les paramètres), la langue, le thème et la déconnexion.
 * `aller(chemin)` : la navigation du menu ; `onLogout` : la déconnexion.
 */
export default function PiedDuMenu({ aller, onLogout }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`.toUpperCase();

  return (
    <Box sx={{ px: 2, py: 1.75, borderTop: `1px solid ${ds.nav.filet}` }}>
      <Box
        component="button"
        type="button"
        onClick={() => aller('/parametres')}
        sx={{
          all: 'unset',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 1.25,
          width: '100%',
          borderRadius: `${ds.radius.sm}px`,
          '&:focus-visible': { outline: `2px solid ${ds.brand.orange}`, outlineOffset: 2 },
        }}
      >
        <Avatar src={user?.avatar_url} sx={{ width: 34, height: 34, bgcolor: ds.white, color: ds.brand.navy, fontSize: '0.875rem', fontWeight: 700 }}>
          {!user?.avatar_url && initials}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap sx={{ color: ds.nav.letter }}>
            {user?.prenom} {user?.nom}
          </Typography>
          <Typography variant="caption" noWrap sx={{ color: ds.nav.letterDim, display: 'block' }}>
            {user?.email}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <LanguageSwitch onDark />
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title={mode === 'dark' ? t('common.themeLight') : t('common.themeDark')}>
          <IconButton
            onClick={toggleTheme}
            aria-label={mode === 'dark' ? t('common.themeLight') : t('common.themeDark')}
            sx={{ color: ds.nav.letterSoft }}
          >
            {mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
          </IconButton>
        </Tooltip>
        <Tooltip title={t('common.logout')}>
          <IconButton onClick={onLogout} aria-label={t('common.logout')} sx={{ color: ds.nav.letterSoft }}>
            <Logout />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
