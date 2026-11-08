/**
 * Identité de l'école (D-21, lots ME-1 et ME-11) : nom, nom court, nom du produit, couleurs,
 * logo. Lue une fois au démarrage du site (main.jsx), avant le premier affichage, puis gardée
 * telle quelle jusqu'au prochain chargement de la page.
 *
 * Le navigateur en garde une copie : la page suivante s'affiche tout de suite aux couleurs de
 * l'école, sans attendre le serveur ; la copie se met à jour en arrière-plan.
 */
import { request } from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const CLE = 'planner.ecole';
// Au premier chargement, le site attend le serveur au plus ce temps, puis s'affiche aux couleurs de Planner
const ATTENTE_MAX_MS = 2500;

// Avant toute réponse : Planner, sans école (aucun nom d'école inventé)
export const IDENTITE_PLANNER = { nom: 'Planner', nom_court: 'Planner', produit: 'Planner', couleur_principale: null, couleur_accent: null, modele_edt: 'planner', logo: null };

let courante = IDENTITE_PLANNER;

const lireCopie = () => {
  try {
    const copie = JSON.parse(localStorage.getItem(CLE));
    return copie?.nom_court ? copie : null;
  } catch {
    return null;
  }
};

/** Garde l'identité pour le prochain chargement (après une modification dans le panneau aussi). */
export const memoriserIdentite = (identite) => {
  try {
    localStorage.setItem(CLE, JSON.stringify(identite));
  } catch {
    // Pas de copie : la page suivante attendra le serveur, sans autre conséquence
  }
};

const lireServeur = async () => {
  const controle = new AbortController();
  const minuterie = setTimeout(() => controle.abort(), ATTENTE_MAX_MS);
  try {
    const reponse = await fetch(`${API_BASE_URL}/etablissement`, { credentials: 'include', signal: controle.signal });
    return reponse.ok ? await reponse.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(minuterie);
  }
};

/**
 * Identité à utiliser pour ce chargement : la copie du navigateur si elle existe (le serveur est
 * relu en arrière-plan pour la fois suivante), sinon la réponse du serveur, sinon Planner.
 */
export const chargerIdentite = async () => {
  const copie = lireCopie();
  const relecture = lireServeur().then((lue) => {
    if (lue) memoriserIdentite(lue);
    return lue;
  });
  courante = copie ?? (await relecture) ?? IDENTITE_PLANNER;
  return courante;
};

/** Identité chargée au démarrage. */
export const identiteEcole = () => courante;

/** Adresse du logo de l'école, ou null (le site affiche alors le nom court). */
export const adresseLogo = (identite = courante) => (identite.logo ? `${API_BASE_URL}/etablissement/logo?v=${identite.logo.version}` : null);

// Panneau de configuration (administration)
export const etablissementAPI = {
  lireConfiguration: () => request('/etablissement/configuration'),
  modifier: (donnees) => request('/etablissement', { method: 'PUT', body: donnees }),
  envoyerLogo: (fichier) => request('/etablissement/logo', { method: 'PUT', body: fichier, headers: { 'Content-Type': fichier.type || 'application/octet-stream' } }),
  retirerLogo: () => request('/etablissement/logo', { method: 'DELETE' }),
};
