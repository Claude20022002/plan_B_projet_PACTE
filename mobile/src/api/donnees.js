import { byStart, toBoardSession, toLocalISODate } from '../../../shared/session.js';
import { biblio, planner } from './client';

/**
 * Données de l'application : emploi du temps et alertes (Planner), bibliothèque (StudyLib).
 * Les séances passent par la même normalisation que le web (shared/session.js).
 */

const ajouterJours = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
};

/** Séance API → ligne de panneau, avec le campus, le type CM/TD/TP et le distanciel */
export const versSeance = (a) => {
  const seance = toBoardSession({
    ...a,
    salle: a.salle ? { ...a.salle, batiment: a.salle.batiment || a.salle.campus?.nom || null } : null,
  });
  const composante = a.enseignement?.composante;
  return {
    ...seance,
    courseType: composante?.type || seance.courseType,
    distanciel: composante?.modalite === 'distanciel',
    mention: composante?.mention || null,
  };
};

/** Séances de l'étudiant connecté entre deux dates (annulées comprises) */
export const chargerSeances = async (du, au) => {
  const reponse = await planner(`/emplois-du-temps/moi?du=${toLocalISODate(du)}&au=${toLocalISODate(au)}`);
  return { groupes: reponse.groupes, seances: (reponse.seances || []).map(versSeance).sort(byStart) };
};

export const chargerTableau = async (horizonJours, maintenant = new Date()) => chargerSeances(maintenant, ajouterJours(maintenant, horizonJours));

/** Alertes non lues (reports, annulations, changements) */
export const chargerAlertes = async (idUser, { nonLues = true } = {}) => {
  const reponse = await planner(`/notifications/user/${idUser}${nonLues ? '/non-lues' : ''}`);
  return reponse?.data || reponse || [];
};

// ── Bibliothèque (StudyLib) ──────────────────────────────────────────────

/** { CODE: { module_id, documents, url } } pour les codes de modules demandés (50 au plus) */
export const chargerSupports = async (codes) => {
  const uniques = [...new Set(codes.filter(Boolean))].slice(0, 50);
  if (!uniques.length) return {};
  const requete = uniques.map((c) => `codes[]=${encodeURIComponent(c)}`).join('&');
  return (await biblio(`/modules/supports?${requete}`)).supports || {};
};

export const chargerDocuments = async (moduleId) => (await biblio(`/documents?module_id=${encodeURIComponent(moduleId)}`)).data || [];

/** URL signée de 5 minutes, ouverte dans le navigateur du téléphone */
export const lienTelechargement = async (idDocument) => (await biblio(`/documents/${encodeURIComponent(idDocument)}/download`, { method: 'POST' })).url;

export const chargerAvisStage = async () => {
  const reponse = await biblio('/internship-reviews');
  return reponse?.data || reponse || [];
};

export const chargerIdeesProjet = async () => {
  const reponse = await biblio('/project-ideas');
  return reponse?.data || reponse || [];
};

export const partagerStage = (avis) => biblio('/internship-reviews', { method: 'POST', body: avis });
