/**
 * Adresse de la plateforme (Planner et la bibliothèque sur la même origine).
 * EXPO_PUBLIC_API_URL : https://planner.hestim.ma en production (eas.json), l'adresse IP du PC
 * sur le réseau local en développement (http://192.168.x.y).
 */
const origine = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost').replace(/\/$/, '');

/** Hors développement, seul HTTPS est accepté : les jetons ne circulent jamais en clair. */
export const configurationSure = __DEV__ || origine.startsWith('https://');

export const ORIGINE = origine;
export const API_PLANNER = `${origine}/api`;
export const API_BIBLIO = `${origine}/biblio/api`;

/** Fenêtres de lecture de l'emploi du temps */
export const HORIZON_TABLEAU_JOURS = 14;
export const RAFRAICHISSEMENT_MS = 60_000;
