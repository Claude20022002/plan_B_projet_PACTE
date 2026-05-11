import apiClient, { buildParams } from '../apiClient.js';

export const emploiDuTempsAPI = {
  getByEnseignant: (id, params) => apiClient.get(`/emplois-du-temps/enseignant/${id}?${buildParams(params)}`),
  getByGroupe:     (id, params) => apiClient.get(`/emplois-du-temps/groupe/${id}?${buildParams(params)}`),
  getByEtudiant:   (id, params) => apiClient.get(`/emplois-du-temps/etudiant/${id}?${buildParams(params)}`),
  getBySalle:      (id, params) => apiClient.get(`/emplois-du-temps/salle/${id}?${buildParams(params)}`),
  getConsolide:    (params)     => apiClient.get(`/emplois-du-temps/consolide?${buildParams(params)}`),
  generer:         (data)       => apiClient.post('/emplois-du-temps/generer', data),
};
