import apiClient, { buildParams } from '../apiClient.js';

export const enseignantsAPI = {
  getAll:            (params) => apiClient.get(`/enseignants?${buildParams(params)}`),
  getById:           (id)     => apiClient.get(`/enseignants/${id}`),
  create:            (data)   => apiClient.post('/enseignants', data),
  update:            (id, d)  => apiClient.put(`/enseignants/${id}`, d),
  delete:            (id)     => apiClient.delete(`/enseignants/${id}`),
  importEnseignants: (rows)   => apiClient.post('/enseignants/import', { enseignants: rows }),
};
