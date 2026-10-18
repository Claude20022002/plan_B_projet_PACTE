import { byStart, toBoardSession, toLocalISODate } from '../../../shared/session.js';
import { API_BIBLIO } from '../config';
import { biblio, entetesAuthentifies, planner } from './client';

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
  return {
    groupes: reponse.groupes,
    seances: (reponse.seances || []).map(versSeance).sort(byStart),
    // Agenda : vacances, jours fériés… et examens publiés de l'étudiant
    evenements: reponse.evenements || [],
    examens: reponse.examens || [],
  };
};

export const chargerTableau = async (horizonJours, maintenant = new Date()) => chargerSeances(maintenant, ajouterJours(maintenant, horizonJours));

/** Alertes non lues (reports, annulations, changements) */
export const chargerAlertes = async (idUser, { nonLues = true } = {}) => {
  const reponse = await planner(`/notifications/user/${idUser}${nonLues ? '/non-lues' : ''}`);
  return reponse?.data || reponse || [];
};

/** Annonces reçues (R1) : { annonces: [{ id, titre, corps, cible, auteur, date, lu_le, piece_jointe }], non_lues } */
export const chargerAnnonces = async () => {
  const reponse = await planner('/annonces?limite=30');
  return { annonces: reponse?.annonces || [], non_lues: reponse?.non_lues || 0 };
};

export const chargerAnnonce = async (id) => planner(`/annonces/${encodeURIComponent(id)}`);

/** Accusé de lecture ; la notification de l'annonce passe aussi en lue */
export const marquerAnnonceLue = async (id) => planner(`/annonces/${encodeURIComponent(id)}/lue`, { method: 'POST' });

// ── Bibliothèque (StudyLib) ──────────────────────────────────────────────

/** { CODE: { module_id, documents, url } } pour les codes de modules demandés (50 au plus) */
export const chargerSupports = async (codes) => {
  const uniques = [...new Set(codes.filter(Boolean))].slice(0, 50);
  if (!uniques.length) return {};
  const requete = uniques.map((c) => `codes[]=${encodeURIComponent(c)}`).join('&');
  return (await biblio(`/modules/supports?${requete}`)).supports || {};
};

/** Un document (titre, format, taille), pour ouvrir le lecteur sans passer par la liste */
export const chargerDocument = async (id) => (await biblio(`/documents/${encodeURIComponent(id)}`))?.data;

export const chargerDocuments = async (moduleId) => (await biblio(`/documents?module_id=${encodeURIComponent(moduleId)}`)).data || [];

/** URL signée de 5 minutes, ouverte dans le navigateur du téléphone */
export const lienTelechargement = async (idDocument) => (await biblio(`/documents/${encodeURIComponent(idDocument)}/download`, { method: 'POST' })).url;

// ── Mes cours : supports déposés par les enseignants pour ma classe (espace de cours) ─────────

/** Mes classes qui ont des supports publiés : [{ id_cours, code_cours, nom_cours, id_groupe, nom_groupe }] */
export const chargerMesCours = async () => (await planner('/etudiant/cours')) ?? [];

/** Sections et supports publiés d'une classe : { classe, sections: [{ titre, supports }] } */
export const chargerEspaceCours = async (idCours, idGroupe) => planner(`/classes/${encodeURIComponent(idCours)}/${encodeURIComponent(idGroupe)}/supports`);

/** Adresse d'un support : le lien, ou une URL signée de 5 minutes (Planner vérifie la classe) */
export const lienSupport = async (idSupport) => (await planner(`/supports-cours/${encodeURIComponent(idSupport)}/ouvrir`)).url;

/** Derniers retours de stage publiés (liste légère : entreprise, poste, note, photo ou non) */
export const chargerAvisStage = async () => (await biblio('/internship-reviews/recent'))?.data ?? [];

/** Photo d'un retour de stage : servie par l'API, avec le jeton (jamais par un lien public) */
export const sourcePhotoStage = (id) => ({ uri: `${API_BIBLIO}/internship-reviews/${encodeURIComponent(id)}/photo`, headers: entetesAuthentifies() });

/** Idées de projets (12 par page), avec recherche facultative : { idees, suite } */
export const chargerIdeesProjet = async (q = '', page = 1) => {
  const reponse = await biblio(`/project-ideas/mobile?q=${encodeURIComponent(q)}&page=${page}`);
  return { idees: reponse?.data ?? [], suite: Boolean(reponse?.has_more) };
};

/** Documents publiés dont le titre ou le module contient le texte (2 caractères au moins) */
export const rechercherDocuments = async (q) => (await biblio(`/documents/search?q=${encodeURIComponent(q)}`))?.data ?? [];

/** Publie un retour de stage ; avec une photo (déjà réduite), l'envoi passe en formulaire multipart */
export const partagerStage = (avis, photo = null) => {
  if (!photo) return biblio('/internship-reviews', { method: 'POST', body: avis });
  const formulaire = new FormData();
  Object.entries(avis).forEach(([cle, valeur]) => {
    if (valeur === null || valeur === undefined || valeur === '') return;
    formulaire.append(cle, typeof valeur === 'boolean' ? (valeur ? '1' : '0') : String(valeur));
  });
  formulaire.append('photo', { uri: photo.uri, name: 'stage.jpg', type: 'image/jpeg' });
  return biblio('/internship-reviews', { method: 'POST', body: formulaire });
};

/** Parties ClassQuiz en cours dans les séances de l'étudiant (lien de jeu https uniquement) */
export const chargerPartiesQuiz = async () => {
  const reponse = await planner('/quiz/parties/en-cours');
  return (reponse.data || []).filter((p) => typeof p.url !== 'string' || /^https:\/\//.test(p.url));
};

/**
 * Activités par module (quiz en cours, devoirs, jeux choisis par les enseignants, avec leur but et
 * leur notion) : { profil, modules: [{ code, nom, quiz, devoirs, jeux }] } ; liens de quiz https seulement
 */
export const chargerActivites = async () => {
  const reponse = await planner('/activites');
  const https = (p) => typeof p.url !== 'string' || /^https:\/\//.test(p.url);
  return { ...reponse, modules: (reponse.modules || []).map((m) => ({ ...m, quiz: (m.quiz || []).filter(https) })) };
};

/** Adresse de ClassQuiz et droit de lancer une partie ({ actif, url, peutLancer }) */
export const chargerConfigQuiz = () => planner('/quiz/config');

/** Mes derniers scores : [{ id, titre, score, rang, nb_joueurs, module }] */
export const chargerHistoriqueQuiz = async () => (await planner('/quiz/parties/historique')).data || [];

// ── Devoirs notés (quiz ClassQuiz corrigés par Planner) ───────────────────

/** Mes devoirs : [{ id, titre, module, date_limite, ouvert, rendu: { note } | null }] */
export const chargerDevoirs = async () => (await planner('/devoirs')).data || [];

/** Sujet sans les réponses ; correction après la date limite : { devoir, questions, rendu } */
export const chargerDevoir = (id) => planner(`/devoirs/${encodeURIComponent(id)}`);

/** Rendre ma copie (une réponse par question) : { note, bonnes, notees } */
export const rendreDevoir = (id, reponses) => planner(`/devoirs/${encodeURIComponent(id)}/rendu`, { method: 'POST', body: { reponses } });

/** Résultats d'une partie : { partie, classement (podium), moi, equipes, nuages } */
export const chargerResultatsQuiz = (id) => planner(`/quiz/parties/${encodeURIComponent(id)}/resultats`);

// ── Jeux intégrés (terminal Linux…) ───────────────────────────────────────

/** { profil: { avatar }, jeux: [{ code, titre, resume, source, progression }], modules: [{ id_cours, code, nom, jeux }] } */
export const chargerAccueilJeux = () => planner('/jeux');

/** Choisir son personnage (shared/jeux/avatars.js) */
export const choisirAvatar = (avatar) => planner('/jeux/profil', { method: 'PUT', body: { avatar } });

/** Défis réussis dans un jeu : { reussis, total, points, defis: [{ id, points, indices }] } */
export const chargerProgressionJeu = (code) => planner(`/jeux/${encodeURIComponent(code)}/progression`);

/**
 * Enregistre une réussite : le serveur rejoue les commandes de la partie (depuis son début) et
 * calcule les points selon les indices utilisés.
 */
export const enregistrerReussite = (code, idDefi, indices, commandes) =>
  planner(`/jeux/${encodeURIComponent(code)}/defis/${encodeURIComponent(idDefi)}/reussite`, { method: 'POST', body: { indices, commandes } });

// ── Sessions de jeu lancées en classe (QR code projeté par l'enseignant) ───────

/** Rejoindre par le code du QR : { id_session_jeu, code_jeu, mode, module, … } */
export const rejoindreSessionJeu = (code) => planner('/sessions-jeu/rejoindre', { method: 'POST', body: { code } });

/** Mode collectif : le tableau de la classe { id_defi, commandes, reussi, statut, ma_proposition } */
export const chargerTableauJeu = (id) => planner(`/sessions-jeu/${encodeURIComponent(id)}/tableau`);

/** Mode collectif : envoyer ma réponse (remplace la précédente en attente) */
export const proposerAuTableau = (id, texte) => planner(`/sessions-jeu/${encodeURIComponent(id)}/propositions`, { method: 'POST', body: { texte } });

/** Dernière demande de changement de téléphone (R-10) : { id, statut, motif, demandee_le, decidee_le }, ou null. */
export const chargerDemandeTelephone = async () => (await planner('/presences/telephone/demande'))?.data ?? null;

/**
 * Déclare le téléphone en main comme nouveau téléphone pour l'appel : l'identifiant d'installation
 * part dans l'en-tête X-Appareil, comme pour le scan. Rend la demande enregistrée.
 */
export const demanderChangementTelephone = (motif) => planner('/presences/telephone/demande', { method: 'POST', body: motif ? { motif } : {} });
