import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

/**
 * expo-notifications, chargé seulement là où le push existe. Depuis le SDK 55, le simple import du
 * module dans Expo Go sur Android lève une erreur (le push y a été retiré au SDK 53) et casserait
 * tous les écrans qui en dépendent. En build de développement, en production et sur iOS : chargé.
 */
export const pushDisponible = !(Platform.OS === 'android' && Constants.executionEnvironment === ExecutionEnvironment.StoreClient);

// require conditionnel : le module n'est évalué que si le push est disponible
export const Notifications = pushDisponible ? require('expo-notifications') : null;
