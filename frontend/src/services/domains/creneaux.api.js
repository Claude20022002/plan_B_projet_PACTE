import apiClient, { buildParams } from '../apiClient.js';

export const creneauxAPI = {
  getAll:  (params) => apiClient.get(`/creneaux?${buildParams(params)}`),
  getById: (id)     => apiClient.get(`/creneaux/${id}`),
  create:  (data)   => apiClient.post('/creneaux', data),
  update:  (id, d)  => apiClient.put(`/creneaux/${id}`, d),
  delete:  (id)     => apiClient.delete(`/creneaux/${id}`),
};
