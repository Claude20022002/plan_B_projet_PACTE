import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_PLANNER } from './config';

/**
 * Identité de l'école (D-21, lots ME-1 et ME-11) : nom, nom court, nom du produit, couleurs,
 * logo, lus sur le serveur de l'école (GET /api/etablissement) au lancement de l'application.
 * Le téléphone en garde une copie : l'application s'ouvre tout de suite aux couleurs de l'école,
 * même sans réseau, et la copie se met à jour en arrière-plan pour le lancement suivant.
 * La copie n'est pas effacée à la déconnexion : elle ne contient rien de personnel.
 */

const CLE = 'planner.ecole';
// Premier lancement : l'application attend le serveur au plus ce temps, puis s'ouvre en Planner
const ATTENTE_MAX_MS = 2500;

export const IDENTITE_PLANNER = { nom: 'Planner', nom_court: 'Planner', produit: 'Planner', couleur_principale: null, couleur_accent: null, logo: null };

let courante = IDENTITE_PLANNER;

const lireCopie = async () => {
  try {
    const copie = JSON.parse((await AsyncStorage.getItem(CLE)) || 'null');
    return copie?.nom_court ? copie : null;
  } catch {
    return null;
  }
};

const lireServeur = async (lire = fetch) => {
  const controle = new AbortController();
  const minuterie = setTimeout(() => controle.abort(), ATTENTE_MAX_MS);
  try {
    const reponse = await lire(`${API_PLANNER}/etablissement`, { signal: controle.signal });
    return reponse.ok ? await reponse.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(minuterie);
  }
};

/** Identité de ce lancement : la copie du téléphone, sinon la réponse du serveur, sinon Planner. */
export const chargerIdentite = async (lire = fetch) => {
  const copie = await lireCopie();
  const relecture = lireServeur(lire).then(async (lue) => {
    if (lue) await AsyncStorage.setItem(CLE, JSON.stringify(lue)).catch(() => {});
    return lue;
  });
  courante = copie ?? (await relecture) ?? IDENTITE_PLANNER;
  return courante;
};

/** Identité chargée au lancement. */
export const identiteEcole = () => courante;

/** Adresse du logo de l'école, ou null (l'application affiche alors le nom seul). */
export const adresseLogo = (identite = courante) => (identite.logo ? `${API_PLANNER}/etablissement/logo?v=${identite.logo.version}` : null);
