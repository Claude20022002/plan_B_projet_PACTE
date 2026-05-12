import apiClient from '../apiClient.js';

export const generationAPI = {
  generer: (data) => apiClient.post('/generation-automatique/generer', data),
  snapshots: (params) => apiClient.get('/generation-automatique/snapshots', { params }),
  snapshot: (id) => apiClient.get(`/generation-automatique/snapshots/${id}`),
  activerSnapshot: (id) => apiClient.post(`/generation-automatique/snapshots/${id}/activate`),
  rollbackSnapshot: (id) => apiClient.post(`/generation-automatique/snapshots/${id}/rollback`),
};
