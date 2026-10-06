import { Linking } from 'react-native';
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

/**
 * Adresse absolue https ouverte telle quelle (quiz, documents signés). Si le navigateur intégré
 * refuse de s'ouvrir (déjà ouvert, fenêtre en cours de fermeture), le lien part dans le
 * navigateur du téléphone plutôt que de ne rien faire.
 */
export const ouvrirAdresse = async (url, couleurs) => {
  if (typeof url !== 'string' || !/^https?:\/\//.test(url)) return;
  try {
    const resultat = await WebBrowser.openBrowserAsync(url, optionsNavigateur(couleurs));
    if (resultat?.type === 'locked') throw new Error('navigateur occupé');
  } catch {
    await Linking.openURL(url).catch(() => {});
  }
};

/** Laisse une fenêtre (feuille, modale) finir de se fermer avant d'ouvrir le navigateur */
export const apresFermeture = (action) => setTimeout(action, 450);

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
