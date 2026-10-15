import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tab, Tabs } from '@mui/material';

/**
 * « Mon service » de l'enseignant (docs/plans/espace-de-cours.md, lot E-8) : ses services, ses
 * disponibilités et ses demandes de report, trois onglets d'une même rubrique au lieu de trois
 * entrées de menu. Chaque onglet garde son adresse : les notifications, les fiches d'aide et le
 * tableau de bord qui y mènent restent valables.
 */
const ONGLETS_MON_SERVICE = [
  { chemin: '/mes-services', cle: 'monService.services' },
  { chemin: '/disponibilites', cle: 'monService.disponibilites' },
  { chemin: '/demandes-report', cle: 'monService.reports' },
];

export default function OngletsMonService() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Tabs
      value={ONGLETS_MON_SERVICE.some((o) => o.chemin === pathname) ? pathname : false}
      onChange={(_, chemin) => navigate(chemin)}
      variant="scrollable"
      allowScrollButtonsMobile
      aria-label={t('nav.myService')}
      sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
    >
      {ONGLETS_MON_SERVICE.map((o) => (
        <Tab key={o.chemin} value={o.chemin} label={t(o.cle)} sx={{ textTransform: 'none', fontSize: '0.9375rem' }} />
      ))}
    </Tabs>
  );
}
