import apiClient, { buildParams } from '../apiClient.js';

export const groupesAPI = {
  getAll:  (params) => apiClient.get(`/groupes?${buildParams(params)}`),
  getById: (id)     => apiClient.get(`/groupes/${id}`),
  create:  (data)   => apiClient.post('/groupes', data),
  update:  (id, d)  => apiClient.put(`/groupes/${id}`, d),
  delete:  (id)     => apiClient.delete(`/groupes/${id}`),
};
