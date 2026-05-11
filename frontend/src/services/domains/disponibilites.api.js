import apiClient, { buildParams } from '../apiClient.js';

export const disponibilitesAPI = {
  getAll:              (params) => apiClient.get(`/disponibilites?${buildParams(params)}`),
  getById:             (id)     => apiClient.get(`/disponibilites/${id}`),
  getByEnseignant:     (id)     => apiClient.get(`/disponibilites/enseignant/${id}`),
  getIndisponibilites: (id)     => apiClient.get(`/disponibilites/enseignant/${id}/indisponibilites`),
  create:              (data)   => apiClient.post('/disponibilites', data),
  update:              (id, d)  => apiClient.put(`/disponibilites/${id}`, d),
  delete:              (id)     => apiClient.delete(`/disponibilites/${id}`),
};
