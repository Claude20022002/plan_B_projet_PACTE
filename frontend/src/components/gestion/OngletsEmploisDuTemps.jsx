import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tab, Tabs } from '@mui/material';

/**
 * Les trois vues des séances, réunies sous l'entrée « Emplois du temps » du menu admin : la grille
 * de la semaine, la liste des séances (recherche, modification) et le mois à imprimer.
 */
const VUES = [
  { chemin: '/gestion/emplois-du-temps', cle: 'vuesEdt.grille' },
  { chemin: '/gestion/affectations', cle: 'vuesEdt.liste' },
  { chemin: '/emploi-du-temps/mensuel', cle: 'vuesEdt.mois' },
];

export default function OngletsEmploisDuTemps() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = Math.max(0, VUES.findIndex((v) => v.chemin === pathname));

  return (
    <Tabs value={active} onChange={(_, i) => navigate(VUES[i].chemin)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} variant="scrollable" allowScrollButtonsMobile aria-label={t('nav.timetables')}>
      {VUES.map((v) => (
        <Tab key={v.chemin} label={t(v.cle)} />
      ))}
    </Tabs>
  );
}
