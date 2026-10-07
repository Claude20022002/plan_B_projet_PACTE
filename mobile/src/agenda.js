import { Linking, Platform } from 'react-native';
import { planner } from './api/client';
import { ORIGINE } from './config';
import { ouvrirAdresse } from './espaces/ouvrir';

/**
 * Ajoute l'agenda personnel (flux ICS, R4) au calendrier du téléphone. iPhone : l'adresse webcal://
 * ouvre l'abonnement dans Calendrier. Android : pas de gestionnaire webcal en général, donc Google
 * Agenda s'ouvre sur l'ajout de l'abonnement.
 */
export const ajouterAuCalendrier = async (couleurs) => {
  const { chemin } = await planner('/agenda/abonnement');
  const webcal = `${ORIGINE}${chemin}`.replace(/^https?:/, 'webcal:');
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;
  if (Platform.OS === 'ios' && (await Linking.canOpenURL(webcal).catch(() => false))) {
    await Linking.openURL(webcal);
    return;
  }
  await ouvrirAdresse(google, couleurs);
};
