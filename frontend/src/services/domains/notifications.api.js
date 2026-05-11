import apiClient, { buildParams } from '../apiClient.js';

export const notificationsAPI = {
  getAll:         (params)   => apiClient.get(`/notifications?${buildParams(params)}`),
  getById:        (id)       => apiClient.get(`/notifications/${id}`),
  getByUser:      (userId)   => apiClient.get(`/notifications/user/${userId}`),
  getNonLues:     (userId)   => apiClient.get(`/notifications/user/${userId}/non-lues`),
  create:         (data)     => apiClient.post('/notifications', data),
  update:         (id, data) => apiClient.put(`/notifications/${id}`, data),
  marquerCommeLue:(id)       => apiClient.patch(`/notifications/${id}/lire`),
  marquerToutesLues:(userId) => apiClient.patch(`/notifications/user/${userId}/tout-lire`),
  delete:         (id)       => apiClient.delete(`/notifications/${id}`),
};
