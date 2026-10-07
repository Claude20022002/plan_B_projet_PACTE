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

/**
 * Identifiant de cette installation de l'application, tiré au hasard la première fois et gardé à la
 * déconnexion : l'appel par QR n'accepte qu'un étudiant par téléphone et par séance. Ce n'est pas
 * un identifiant matériel ; il ne quitte jamais le trousseau ailleurs que vers Planner.
 */
const CLE_INSTALLATION = 'hestim.installation';

const tirerIdentifiant = () => {
  const octets = new Uint8Array(24);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(octets);
  else for (let i = 0; i < octets.length; i += 1) octets[i] = Math.floor(Math.random() * 256);
  return Array.from(octets, (o) => o.toString(16).padStart(2, '0')).join('');
};

export const lireIdentifiantInstallation = async () => {
  const existant = await SecureStore.getItemAsync(CLE_INSTALLATION, OPTIONS);
  if (existant) return existant;
  const nouveau = tirerIdentifiant();
  await SecureStore.setItemAsync(CLE_INSTALLATION, nouveau, OPTIONS);
  return nouveau;
};

export const lirePushToken =() => SecureStore.getItemAsync(CLES.pushToken, OPTIONS);
export const enregistrerPushToken = (token) => SecureStore.setItemAsync(CLES.pushToken, token, OPTIONS);
export const effacerPushToken = () => SecureStore.deleteItemAsync(CLES.pushToken, OPTIONS);
