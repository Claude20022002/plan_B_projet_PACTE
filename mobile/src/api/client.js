import { API_BIBLIO, API_PLANNER, configurationSure } from '../config';
import { effacerJetons, enregistrerJetons, lireIdentifiantInstallation, lireJetons } from '../auth/stockage';

/**
 * Client HTTP de l'application : jeton d'accès de Planner en Bearer, en-tête X-Client: mobile
 * (Planner renvoie alors ses jetons dans le corps), et X-Appareil, l'identifiant de l'installation
 * (appel par QR). Un jeton expiré est renouvelé une seule fois (une seule requête de renouvellement
 * même si plusieurs appels échouent en même temps) ; si le renouvellement échoue, la session est
 * perdue et l'application revient à la connexion.
 */

export class ErreurApi extends Error {
  constructor(statut, message, code) {
    super(message || `Erreur ${statut}`);
    this.statut = statut;
    this.code = code;
  }
}

const CODES_RENOUVELLEMENT = new Set(['TOKEN_EXPIRED', 'TOKEN_MISSING', 'TOKEN_INVALID']);
const DELAI_MS = 15_000;

let jetons = null;
let renouvellementEnCours = null;
let surSessionPerdue = () => {};
let installation = null;

// Lu une fois ; sans trousseau disponible, l'en-tête est simplement absent
const identifiantInstallation = () => (installation ??= lireIdentifiantInstallation().catch(() => null));

export const definirSurSessionPerdue = (rappel) => {
  surSessionPerdue = rappel;
};

export const chargerJetons = async () => {
  jetons = await lireJetons();
  return jetons;
};

export const definirJetons = async (nouveaux) => {
  jetons = nouveaux;
  if (nouveaux) await enregistrerJetons(nouveaux);
  else await effacerJetons();
};

export const jetonsCourants = () => jetons;

/** En-têtes d'une image ou d'un fichier lu hors de fetch (composant Image, téléchargement) */
export const entetesAuthentifies = () => ({ 'X-Client': 'mobile', ...(jetons?.acces ? { Authorization: `Bearer ${jetons.acces}` } : {}) });

const appeler = async (url, { method = 'GET', body, auth = true } = {}) => {
  if (!configurationSure) throw new ErreurApi(0, 'Configuration non sécurisée', 'CONFIG_HTTP');
  const appareil = url.startsWith(API_PLANNER) ? await identifiantInstallation() : null;
  const controleur = new AbortController();
  const minuterie = setTimeout(() => controleur.abort(), DELAI_MS);
  try {
    const reponse = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        'X-Client': 'mobile',
        ...(appareil ? { 'X-Appareil': appareil } : {}),
        // Formulaire avec fichier (photo) : le type multipart et sa limite sont posés par fetch
        ...(body !== undefined && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && jetons?.acces ? { Authorization: `Bearer ${jetons.acces}` } : {}),
      },
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      signal: controleur.signal,
    });
    const texte = await reponse.text();
    let donnees = null;
    try {
      donnees = texte ? JSON.parse(texte) : null;
    } catch {
      donnees = null;
    }
    return { reponse, donnees };
  } catch {
    throw new ErreurApi(0, 'Réseau indisponible', 'RESEAU');
  } finally {
    clearTimeout(minuterie);
  }
};

const renouveler = () => {
  renouvellementEnCours ??= (async () => {
    try {
      if (!jetons?.renouvellement) throw new Error('aucun jeton');
      const { reponse, donnees } = await appeler(`${API_PLANNER}/auth/refresh`, { method: 'POST', body: { refresh_token: jetons.renouvellement }, auth: false });
      if (!reponse.ok || !donnees?.access_token) throw new Error('refus');
      await definirJetons({ acces: donnees.access_token, renouvellement: donnees.refresh_token });
      return true;
    } catch (erreur) {
      // Réseau coupé : on garde la session (le cache s'affiche) ; refus du serveur : session perdue
      if (erreur instanceof ErreurApi && erreur.code === 'RESEAU') throw erreur;
      await definirJetons(null);
      surSessionPerdue();
      return false;
    } finally {
      renouvellementEnCours = null;
    }
  })();
  return renouvellementEnCours;
};

export const requete = async (base, chemin, options = {}) => {
  let { reponse, donnees } = await appeler(`${base}${chemin}`, options);
  // StudyLib répond 401 sans code : même traitement que Planner pour un jeton expiré
  const aRenouveler = reponse.status === 401 && options.auth !== false && (base === API_BIBLIO || CODES_RENOUVELLEMENT.has(donnees?.code));
  if (aRenouveler && (await renouveler())) {
    ({ reponse, donnees } = await appeler(`${base}${chemin}`, options));
  }
  if (!reponse.ok) throw new ErreurApi(reponse.status, donnees?.message || donnees?.error, donnees?.code);
  return donnees;
};

export const planner = (chemin, options) => requete(API_PLANNER, chemin, options);
export const biblio = (chemin, options) => requete(API_BIBLIO, chemin, options);
