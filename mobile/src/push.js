import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { Notifications, pushDisponible } from './notifications';
import Constants from 'expo-constants';
import { planner } from './api/client';
import { effacerPushToken, enregistrerPushToken, lirePushToken } from './auth/stockage';

/**
 * Notifications push (reports, annulations, changements de salle) : l'appareil s'inscrit auprès
 * de Planner après la connexion, et se désinscrit à la déconnexion. Canal Android « planning »,
 * le même que celui des envois de Planner (services/push.js).
 */

Notifications?.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export const inscrireAuxNotifications = async () => {
  // Les push n'arrivent que sur un vrai téléphone (pas un émulateur sans services Google), hors Expo Go Android
  if (!pushDisponible || !Device.isDevice) return null;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('planning', {
      name: 'Emploi du temps',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== 'granted') return null;

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) return null;
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await planner('/push-tokens', { method: 'POST', body: { token, plateforme: Platform.OS === 'ios' ? 'ios' : 'android' } });
  await enregistrerPushToken(token);
  return token;
};

/** À la déconnexion : le téléphone ne reçoit plus les alertes de ce compte. */
export const desinscrireDesNotifications = async () => {
  const token = await lirePushToken().catch(() => null);
  if (!token) return;
  await planner(`/push-tokens/${encodeURIComponent(token)}`, { method: 'DELETE' }).catch(() => {});
  await effacerPushToken().catch(() => {});
};

export const notificationsActives = async () => Boolean(await lirePushToken().catch(() => null));

/**
 * Où en est l'autorisation des alertes sur ce téléphone : 'accordee', 'a_demander', 'refusee',
 * ou null là où le push n'existe pas (Expo Go sur Android, émulateur).
 */
export const etatAutorisation = async () => {
  if (!pushDisponible || !Device.isDevice) return null;
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'accordee';
  return canAskAgain === false ? 'refusee' : 'a_demander';
};

/**
 * Après la connexion : réinscrit le téléphone sans rien demander si les alertes sont déjà
 * autorisées. La première demande passe par la proposition du premier lancement (R-11), qui
 * explique à quoi servent les alertes avant la fenêtre du système.
 */
export const inscrireSiAutorise = async () => ((await etatAutorisation()) === 'accordee' ? inscrireAuxNotifications() : null);
