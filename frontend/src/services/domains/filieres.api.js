import apiClient, { buildParams } from '../apiClient.js';

export const filieresAPI = {
  getAll:  (params) => apiClient.get(`/filieres?${buildParams(params)}`),
  getById: (id)     => apiClient.get(`/filieres/${id}`),
  create:  (data)   => apiClient.post('/filieres', data),
  update:  (id, d)  => apiClient.put(`/filieres/${id}`, d),
  delete:  (id)     => apiClient.delete(`/filieres/${id}`),
};
