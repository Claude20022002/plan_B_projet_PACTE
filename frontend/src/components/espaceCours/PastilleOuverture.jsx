import { useTranslation } from 'react-i18next';
import { Chip } from '@mui/material';
import { etatOuverture } from '../../utils/ouverture';
import { localeEcran } from '../../utils/dates';

/**
 * Pastille d'état d'ouverture d'une section ou d'un support (lot EC-1), pour l'enseignant :
 * « Ouvre le … », « Fermé depuis le … » ou « Jusqu'au … ». Rien quand aucune date ne joue.
 */
export default function PastilleOuverture({ element }) {
  const { t, i18n } = useTranslation();
  const { etat, date } = etatOuverture(element);
  if (etat === 'libre') return null;
  const jour = new Date(`${date}T12:00:00`).toLocaleDateString(localeEcran(i18n.language), { day: 'numeric', month: 'short' });
  const cle = { programme: 'ouvreLe', ferme: 'fermeDepuis', ouvert: 'jusquAu' }[etat];
  return <Chip size="small" variant="outlined" color={etat === 'ouvert' ? 'default' : 'warning'} label={t(`espaceCours.ouverture.${cle}`, { date: jour })} />;
}
