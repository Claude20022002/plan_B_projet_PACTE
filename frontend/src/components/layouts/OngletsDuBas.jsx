import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { ds } from '../../design-system/tokens';

/**
 * Onglets du bas sur téléphone (étudiant et enseignant) : `onglets` vient de bottomTabsFor,
 * `nonLues` est le nombre d'alertes non lues, `aller(chemin)` la navigation du menu.
 */
export default function OngletsDuBas({ onglets, nonLues, aller }) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <Paper
      component="nav"
      aria-label={t('nav.menu')}
      square
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        borderTop: '1px solid',
        borderColor: 'divider',
        pb: 'env(safe-area-inset-bottom)',
      }}
    >
      <BottomNavigation
        showLabels
        value={onglets.findIndex((tab) => tab.path === location.pathname)}
        onChange={(_, index) => aller(onglets[index].path)}
        sx={{
          height: 64,
          '& .MuiBottomNavigationAction-root': { minWidth: 0, px: 0.5, color: 'text.secondary' },
          '& .MuiBottomNavigationAction-root.Mui-selected': { color: 'primary.main' },
          '& .MuiBottomNavigationAction-label': {
            fontFamily: ds.font.board,
            fontWeight: 600,
            fontSize: '0.75rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            mt: 0.25,
          },
          '& .MuiBottomNavigationAction-label.Mui-selected': { fontSize: '0.75rem' },
        }}
      >
        {onglets.map((tab) => (
          <BottomNavigationAction
            key={tab.path}
            label={t(tab.key)}
            icon={
              tab.badge ? (
                <Badge badgeContent={nonLues} color="secondary">
                  {tab.icon}
                </Badge>
              ) : (
                tab.icon
              )
            }
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
