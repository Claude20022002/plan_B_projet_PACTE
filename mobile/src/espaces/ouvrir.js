import * as WebBrowser from 'expo-web-browser';
import { planner } from '../api/client';
import { ORIGINE } from '../config';

/**
 * Ouvre une page web de la plateforme dans le navigateur intégré, déjà connecté : Planner remet
 * un code à usage unique (60 s) que la page /api/auth/passerelle échange contre une session web,
 * puis elle redirige vers le chemin demandé (Planner, /biblio/ pour StudyLib, /jeux…).
 * Sans réseau ou sans passerelle, la page s'ouvre sur la connexion du site.
 */

const optionsNavigateur = (couleurs) => ({ toolbarColor: couleurs.cadre, controlsColor: couleurs.surCadre, dismissButtonStyle: 'close' });

/** Adresse absolue https ouverte telle quelle (quiz, documents signés) */
export const ouvrirAdresse = (url, couleurs) =>
  typeof url === 'string' && /^https?:\/\//.test(url) ? WebBrowser.openBrowserAsync(url, optionsNavigateur(couleurs)).catch(() => {}) : Promise.resolve();

/** Chemin de la plateforme (« / », « /biblio/ »…) ouvert avec la session de l'application */
export const ouvrirSurLeWeb = async (chemin, couleurs) => {
  let url = `${ORIGINE}${chemin}`;
  try {
    const { code } = await planner('/auth/passerelle', { method: 'POST', body: { suite: chemin } });
    if (typeof code === 'string' && code) url = `${ORIGINE}/api/auth/passerelle?code=${encodeURIComponent(code)}`;
  } catch {
    // Pas de code : la page demandera de se connecter
  }
  return ouvrirAdresse(url, couleurs);
};
