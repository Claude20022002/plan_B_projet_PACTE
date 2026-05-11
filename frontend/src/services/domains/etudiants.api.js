import apiClient, { buildParams } from '../apiClient.js';

export const etudiantsAPI = {
  getAll:          (params) => apiClient.get(`/etudiants?${buildParams(params)}`),
  getById:         (id)     => apiClient.get(`/etudiants/${id}`),
  create:          (data)   => apiClient.post('/etudiants', data),
  update:          (id, d)  => apiClient.put(`/etudiants/${id}`, d),
  delete:          (id)     => apiClient.delete(`/etudiants/${id}`),
  importEtudiants: (rows)   => apiClient.post('/etudiants/import', { etudiants: rows }),
  syncGroupes:     ()       => apiClient.post('/etudiants/sync-groupes'),
};
