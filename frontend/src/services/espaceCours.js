/**
 * Espace de cours d'une classe (docs/plans/espace-de-cours.md) : sections et supports. Les fichiers
 * vont dans la Bibliothèque (StudyLib) par le serveur de Planner ; le site ne voit que des références.
 */
import { authAPI, ensureCsrfToken, request, telecharger } from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const classe = (idCours, idGroupe) => `/classes/${idCours}/${idGroupe}`;

export const espaceCoursAPI = {
  lire: (idCours, idGroupe) => request(`${classe(idCours, idGroupe)}/supports`),
  creerSection: (idCours, idGroupe, titre) => request(`${classe(idCours, idGroupe)}/sections`, { method: 'POST', body: { titre } }),
  ordonnerSections: (idCours, idGroupe, ids) => request(`${classe(idCours, idGroupe)}/sections/ordre`, { method: 'PUT', body: { ids } }),
  modifierSection: (id, champs) => request(`/sections-cours/${id}`, { method: 'PUT', body: champs }),
  supprimerSection: (id) => request(`/sections-cours/${id}`, { method: 'DELETE' }),
  ajouterLien: (idSection, lien) => request(`/sections-cours/${idSection}/liens`, { method: 'POST', body: lien }),
  // Documents publiés de la Bibliothèque à épingler dans la classe, sans copie (lot E-9)
  chercherBibliotheque: (idCours, idGroupe, q) => request(`${classe(idCours, idGroupe)}/bibliotheque?${new URLSearchParams({ q })}`),
  epingler: (idSection, idDocument) => request(`/sections-cours/${idSection}/bibliotheque`, { method: 'POST', body: { id_document: idDocument } }),
  modifierSupport: (id, champs) => request(`/supports-cours/${id}`, { method: 'PUT', body: champs }),
  retirerSupport: (id) => request(`/supports-cours/${id}`, { method: 'DELETE' }),
  publierSupport: (id) => request(`/supports-cours/${id}/publier`, { method: 'POST' }),
  // Adresse à ouvrir : le lien, ou un lien de téléchargement valable 5 minutes
  ouvrir: (id) => request(`/supports-cours/${id}/ouvrir`),
  mesCours: () => request('/etudiant/cours'),
  // Appel de la classe (lot E-6) : séances et bilan, taux par étudiant, export CSV
  appels: (idCours, idGroupe) => request(`${classe(idCours, idGroupe)}/appels`),
  eleves: (idCours, idGroupe) => request(`${classe(idCours, idGroupe)}/eleves`),
  exporterPresences: (idCours, idGroupe, nom) => telecharger(`${classe(idCours, idGroupe)}/presences.csv`, nom),
  // Sondages de la classe (lot EC-9) : { actif, gere, sondages } ; réponse anonyme et définitive
  sondages: (idCours, idGroupe) => request(`${classe(idCours, idGroupe)}/sondages`),
  creerSondage: (idCours, idGroupe, sondage) => request(`${classe(idCours, idGroupe)}/sondages`, { method: 'POST', body: sondage }),
  repondreSondage: (id, idChoix) => request(`/sondages/${id}/reponse`, { method: 'POST', body: { id_choix: idChoix } }),
  cloreSondage: (id) => request(`/sondages/${id}/cloture`, { method: 'POST' }),
  supprimerSondage: (id) => request(`/sondages/${id}`, { method: 'DELETE' }),
};

/** Le serveur rend une erreur au format commun { message } ; sinon un message générique. */
const erreurDe = (xhr) => {
  try {
    return new Error(JSON.parse(xhr.responseText)?.message || `Erreur ${xhr.status}`);
  } catch {
    return new Error(`Erreur ${xhr.status}`);
  }
};

const envoyer = (idSection, fichier, titre, onProgression, csrf) =>
  new Promise((resolve, reject) => {
    const donnees = new FormData();
    donnees.append('title', titre);
    donnees.append('file', fichier);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}/sections-cours/${idSection}/fichiers`);
    xhr.withCredentials = true;
    if (csrf) xhr.setRequestHeader('X-CSRF-Token', csrf);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgression?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status === 201 ? resolve(JSON.parse(xhr.responseText)) : reject(Object.assign(erreurDe(xhr), { status: xhr.status })));
    xhr.onerror = () => reject(new Error('Connexion interrompue'));
    xhr.send(donnees);
  });

/**
 * Dépose un fichier dans une section, avec sa progression (0 à 100). XMLHttpRequest plutôt que
 * fetch : seul lui donne la progression de l'envoi. Jeton d'accès expiré (401) : un
 * renouvellement, puis un second essai.
 */
export const deposerFichier = async (idSection, fichier, titre, onProgression) => {
  try {
    return await envoyer(idSection, fichier, titre, onProgression, await ensureCsrfToken());
  } catch (e) {
    if (e.status !== 401) throw e;
    await authAPI.refreshToken();
    return envoyer(idSection, fichier, titre, onProgression, await ensureCsrfToken());
  }
};

/** Titre proposé pour un fichier : son nom sans extension. */
export const titreDuFichier = (fichier) => String(fichier?.name ?? '').replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Document';
