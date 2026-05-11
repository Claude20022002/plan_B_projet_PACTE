import apiClient, { buildParams } from '../apiClient.js';

/**
 * @typedef {Object} Conflit
 * @property {number}  id_conflit
 * @property {'salle'|'enseignant'|'groupe'} type_conflit
 * @property {string}  description
 * @property {string}  date_detection
 * @property {boolean} resolu
 * @property {string}  [date_resolution]
 */

export const conflitsAPI = {
  /** @param {{ page?: number, limit?: number, resolu?: boolean }} [params] */
  getAll: (params) => apiClient.get(`/conflits?${buildParams(params)}`),

  /** @param {number} id */
  getById: (id) => apiClient.get(`/conflits/${id}`),

  /** @param {{ page?: number, limit?: number }} [params] */
  getNonResolus: (params) => apiClient.get(`/conflits/non-resolus/liste?${buildParams(params)}`),

  /** @param {Partial<Conflit>} data */
  create: (data) => apiClient.post('/conflits', data),

  /**
   * Marquer comme résolu : `{ resolu: true, date_resolution: new Date().toISOString() }`
   * @param {number} id
   * @param {Partial<Conflit>} data
   */
  update: (id, data) => apiClient.put(`/conflits/${id}`, data),

  /** @param {number} id */
  delete: (id) => apiClient.delete(`/conflits/${id}`),

  /**
   * @param {number} idConflit
   * @param {number} idAffectation
   */
  associerAffectation:  (idConflit, idAff) => apiClient.post(`/conflits/${idConflit}/affectation/${idAff}`),
  dissocierAffectation: (idConflit, idAff) => apiClient.delete(`/conflits/${idConflit}/affectation/${idAff}`),
};
