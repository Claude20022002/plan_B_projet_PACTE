import apiClient, { buildParams } from '../apiClient.js';

/**
 * @typedef {'en_attente'|'approuvee'|'refusee'} DemandeStatut
 */

export const demandesReportAPI = {
  getAll:          (params)   => apiClient.get(`/demandes-report?${buildParams(params)}`),
  getById:         (id)       => apiClient.get(`/demandes-report/${id}`),
  getByEnseignant: (id)       => apiClient.get(`/demandes-report/enseignant/${id}`),
  getByStatut:     (statut)   => apiClient.get(`/demandes-report/statut/${statut}`),
  create:          (data)     => apiClient.post('/demandes-report', data),
  update:          (id, data) => apiClient.put(`/demandes-report/${id}`, data),
  delete:          (id)       => apiClient.delete(`/demandes-report/${id}`),
  /**
   * @param {number} id
   * @param {'approuver'|'refuser'} action
   */
  traiter: (id, action) => apiClient.patch(`/demandes-report/${id}/traiter`, { action }),
};
