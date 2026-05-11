import apiClient from '../apiClient.js';

export const generationAPI = {
  generer: (data) => apiClient.post('/generation-automatique/generer', data),
};
