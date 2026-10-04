import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Dernier tableau et dernières semaines consultés, pour l'étudiant dans le tram sans réseau :
 * affichés avec « mis à jour à HH:MM ». Effacés à la déconnexion (téléphone prêté ou partagé).
 */
const PREFIXE = 'hestim.cache.';

export const lireCache = async (cle) => {
  try {
    const brut = await AsyncStorage.getItem(PREFIXE + cle);
    return brut ? JSON.parse(brut) : null;
  } catch {
    return null;
  }
};

export const ecrireCache = async (cle, donnees, maintenant = new Date()) => {
  try {
    await AsyncStorage.setItem(PREFIXE + cle, JSON.stringify({ donnees, le: maintenant.toISOString() }));
  } catch {
    // Stockage plein ou indisponible : l'écran fonctionne sans cache
  }
};

export const viderCache = async () => {
  try {
    const cles = (await AsyncStorage.getAllKeys()).filter((c) => c.startsWith(PREFIXE));
    if (cles.length) await AsyncStorage.multiRemove(cles);
  } catch {
    // rien à faire
  }
};
