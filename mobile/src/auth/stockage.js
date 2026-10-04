import * as SecureStore from 'expo-secure-store';

/**
 * Jetons de session dans le trousseau sécurisé de l'appareil (Android Keystore), jamais en
 * clair : accessibles seulement à l'application, et seulement une fois le téléphone déverrouillé.
 */
const CLES = { acces: 'hestim.jeton_acces', renouvellement: 'hestim.jeton_renouvellement', pushToken: 'hestim.push' };
const OPTIONS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export const lireJetons = async () => {
  const [acces, renouvellement] = await Promise.all([SecureStore.getItemAsync(CLES.acces, OPTIONS), SecureStore.getItemAsync(CLES.renouvellement, OPTIONS)]);
  return acces && renouvellement ? { acces, renouvellement } : null;
};

export const enregistrerJetons = async ({ acces, renouvellement }) => {
  await SecureStore.setItemAsync(CLES.acces, acces, OPTIONS);
  await SecureStore.setItemAsync(CLES.renouvellement, renouvellement, OPTIONS);
};

export const effacerJetons = async () => {
  await Promise.all([SecureStore.deleteItemAsync(CLES.acces, OPTIONS), SecureStore.deleteItemAsync(CLES.renouvellement, OPTIONS)]);
};

export const lirePushToken = () => SecureStore.getItemAsync(CLES.pushToken, OPTIONS);
export const enregistrerPushToken = (token) => SecureStore.setItemAsync(CLES.pushToken, token, OPTIONS);
export const effacerPushToken = () => SecureStore.deleteItemAsync(CLES.pushToken, OPTIONS);
