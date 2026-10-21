/**
 * Appels au Studio quiz (moteur de quiz natif de Planner, docs/plans/studio-quiz.md).
 * Enseignant : /api/studio-quiz ; étudiant (et aperçu de l'enseignant) : /api/passations.
 */
import { request, telecharger } from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const avecQuery = (chemin, params) => {
  const query = new URLSearchParams(
    Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length)))
  ).toString();
  return `${chemin}${query ? `?${query}` : ''}`;
};

const typeDe = (fichier) => fichier.type || 'application/octet-stream';

export const studioAPI = {
  // Banque
  lister: (params) => request(avecQuery('/studio-quiz/questionnaires', params)),
  creer: (data) => request('/studio-quiz/questionnaires', { method: 'POST', body: data }),
  detail: (id) => request(`/studio-quiz/questionnaires/${id}`),
  modifier: (id, data) => request(`/studio-quiz/questionnaires/${id}`, { method: 'PUT', body: data }),
  supprimer: (id) => request(`/studio-quiz/questionnaires/${id}`, { method: 'DELETE' }),
  dupliquer: (id) => request(`/studio-quiz/questionnaires/${id}/dupliquer`, { method: 'POST' }),
  exporter: (id, titre) => telecharger(`/studio-quiz/questionnaires/${id}/export`, `${titre || 'quiz'}.json`),
  importer: (donnees) => request('/studio-quiz/import', { method: 'POST', body: donnees }),
  // Quiz du service de quiz (ClassQuiz) : ceux qui restent à importer, puis l'import (en brouillon)
  classquizAImporter: () => request('/studio-quiz/classquiz'),
  classquizImporter: () => request('/studio-quiz/classquiz/importer', { method: 'POST' }),

  // Questions
  ajouterQuestion: (id, question) => request(`/studio-quiz/questionnaires/${id}/questions`, { method: 'POST', body: question }),
  modifierQuestion: (idQuestion, question) => request(`/studio-quiz/questions/${idQuestion}`, { method: 'PUT', body: question }),
  supprimerQuestion: (idQuestion) => request(`/studio-quiz/questions/${idQuestion}`, { method: 'DELETE' }),
  dupliquerQuestion: (idQuestion) => request(`/studio-quiz/questions/${idQuestion}/dupliquer`, { method: 'POST' }),
  marquerRelue: (idQuestion) => request(`/studio-quiz/questions/${idQuestion}/relue`, { method: 'POST' }),
  reordonner: (id, ids) => request(`/studio-quiz/questionnaires/${id}/ordre`, { method: 'PUT', body: { ids } }),

  // Médias
  medias: (type) => request(avecQuery('/studio-quiz/medias', { type })),
  deposerMedia: (fichier, { description, duree } = {}) =>
    request(avecQuery('/studio-quiz/medias', { nom: fichier.name, description, duree }), { method: 'POST', body: fichier, headers: { 'Content-Type': typeDe(fichier) } }),
  modifierMedia: (id, data) => request(`/studio-quiz/medias/${id}`, { method: 'PUT', body: data }),
  supprimerMedia: (id) => request(`/studio-quiz/medias/${id}`, { method: 'DELETE' }),
  urlMedia: (id) => `${API_BASE_URL}/studio-quiz/medias/${id}/contenu`,

  // IA
  disponibiliteIa: () => request('/studio-quiz/ia'),
  generer: ({ fichier, ...params }) =>
    request(avecQuery('/studio-quiz/ia/generations', { ...params, types: params.types?.join(','), etiquettes: params.etiquettes?.join(','), nom: fichier?.name }), {
      method: 'POST',
      ...(fichier ? { body: fichier, headers: { 'Content-Type': typeDe(fichier) } } : {}),
    }),
  regenerer: (idQuestion) => request(`/studio-quiz/questions/${idQuestion}/regenerer`, { method: 'POST' }),
  illustrer: (idQuestion, consigne) => request(`/studio-quiz/questions/${idQuestion}/illustrer`, { method: 'POST', body: { consigne } }),
  voix: (texte, voix) => request('/studio-quiz/medias/voix', { method: 'POST', body: { texte, voix } }),
  transcrire: (idMedia, langue) => request(`/studio-quiz/medias/${idMedia}/transcrire`, { method: 'POST', body: { langue } }),

  // Passations
  sessions: (idQuestionnaire) => request(avecQuery('/studio-quiz/sessions', { id_questionnaire: idQuestionnaire })),
  ouvrir: (id, data) => request(`/studio-quiz/questionnaires/${id}/sessions`, { method: 'POST', body: data }),
  modifierSession: (id, data) => request(`/studio-quiz/sessions/${id}`, { method: 'PUT', body: data }),
  supprimerSession: (id) => request(`/studio-quiz/sessions/${id}`, { method: 'DELETE' }),
  resultats: (id) => request(`/studio-quiz/sessions/${id}/resultats`),
  resultatsCsv: (id, code) => telecharger(`/studio-quiz/sessions/${id}/resultats.csv`, `resultats-${code}.csv`),
  copie: (id) => request(`/studio-quiz/copies/${id}`),
  noter: (idCopie, idQuestion, note) => request(`/studio-quiz/copies/${idCopie}/questions/${idQuestion}/note`, { method: 'PUT', body: note }),
};

export const passationAPI = {
  rejoindre: (code) => request('/passations/rejoindre', { method: 'POST', body: { code } }),
  mesTentatives: () => request('/passations/mes-tentatives'),
  commencer: (idSession) => request(`/passations/sessions/${idSession}/tentatives`, { method: 'POST' }),
  tentative: (id) => request(`/passations/tentatives/${id}`),
  repondre: (id, idQuestion, data) => request(`/passations/tentatives/${id}/reponses/${idQuestion}`, { method: 'PUT', body: data }),
  rendre: (id) => request(`/passations/tentatives/${id}/rendre`, { method: 'POST' }),
  urlMedia: (idTentative, idMedia) => `${API_BASE_URL}/passations/tentatives/${idTentative}/medias/${idMedia}`,
};

/** Quiz en direct du Studio (docs/plans/sortie-classquiz.md, lot SC-1) : l'enseignant anime, l'étudiant joue. */
export const directAPI = {
  lancer: (data) => request('/quiz-direct', { method: 'POST', body: data }),
  vue: (id) => request(`/quiz-direct/${id}`),
  agir: (id, action) => request(`/quiz-direct/${id}/${action}`, { method: 'POST' }),
  rejoindre: (id) => request(`/quiz-direct/${id}/rejoindre`, { method: 'POST' }),
  joueur: (id, depuis) => request(avecQuery(`/quiz-direct/${id}/joueur`, { depuis })),
  repondre: (id, index, reponse) => request(`/quiz-direct/${id}/reponses`, { method: 'POST', body: { index, reponse } }),
  urlMedia: (id, idMedia) => `${API_BASE_URL}/quiz-direct/${id}/medias/${idMedia}`,
};
