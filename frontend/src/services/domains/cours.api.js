import apiClient, { buildParams } from '../apiClient.js';

export const coursAPI = {
  getAll:  (params) => apiClient.get(`/cours?${buildParams(params)}`),
  getById: (id)     => apiClient.get(`/cours/${id}`),
  create:  (data)   => apiClient.post('/cours', data),
  update:  (id, d)  => apiClient.put(`/cours/${id}`, d),
  delete:  (id)     => apiClient.delete(`/cours/${id}`),
};
