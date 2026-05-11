/**
 * affectations.api.js
 * Gestion des affectations — table centrale du planning.
 *
 * @typedef {Object} Affectation
 * @property {number}  id_affectation
 * @property {string}  date_seance       - ISO date 'YYYY-MM-DD'
 * @property {'planifie'|'confirme'|'annule'|'reporte'} statut
 * @property {string}  [commentaire]
 * @property {number}  id_cours
 * @property {number}  id_groupe
 * @property {number}  id_user_enseignant
 * @property {number}  id_salle
 * @property {number}  id_creneau
 * @property {number}  id_user_admin
 * @property {Object}  [cours]
 * @property {Object}  [groupe]
 * @property {Object}  [enseignant]
 * @property {Object}  [salle]
 * @property {Object}  [creneau]
 *
 * @typedef {Object} AffectationCreatePayload
 * @property {string}  date_seance
 * @property {number}  id_cours
 * @property {number}  id_groupe
 * @property {number}  id_user_enseignant
 * @property {number}  id_salle
 * @property {number}  id_creneau
 * @property {string}  [statut]
 * @property {string}  [commentaire]
 *
 * @typedef {Object} AffectationListParams
 * @property {number}  [page]
 * @property {number}  [limit]
 * @property {string}  [statut]
 * @property {string}  [date_debut]
 * @property {string}  [date_fin]
 * @property {string}  [updated_after]   - Sync offline
 */

import apiClient, { buildParams } from '../apiClient.js';

export const affectationsAPI = {
  /**
   * @param {AffectationListParams} [params]
   * @returns {Promise<PaginatedResponse<Affectation>>}
   */
  getAll: (params) => apiClient.get(`/affectations?${buildParams(params)}`),

  /**
   * @param {number} id
   * @returns {Promise<{ data: Affectation }>}
   */
  getById: (id) => apiClient.get(`/affectations/${id}`),

  /**
   * @param {number} enseignantId
   * @param {{ date_debut?: string, date_fin?: string, limit?: number }} [params]
   * @returns {Promise<PaginatedResponse<Affectation>>}
   */
  getByEnseignant: (enseignantId, params) =>
    apiClient.get(`/affectations/enseignant/${enseignantId}?${buildParams(params)}`),

  /**
   * @param {number} groupeId
   * @param {{ date_debut?: string, date_fin?: string }} [params]
   * @returns {Promise<PaginatedResponse<Affectation>>}
   */
  getByGroupe: (groupeId, params) =>
    apiClient.get(`/affectations/groupe/${groupeId}?${buildParams(params)}`),

  /**
   * @param {AffectationCreatePayload} payload
   * @returns {Promise<{ data: Affectation, message: string }>}
   */
  create: (payload) => apiClient.post('/affectations', payload),

  /**
   * @param {number} id
   * @param {Partial<AffectationCreatePayload>} payload
   * @returns {Promise<{ data: Affectation, message: string }>}
   */
  update: (id, payload) => apiClient.put(`/affectations/${id}`, payload),

  /**
   * @param {number} id
   * @returns {Promise<{ message: string }>}
   */
  delete: (id) => apiClient.delete(`/affectations/${id}`),

  /**
   * Confirme une affectation (enseignant ou admin).
   * @param {number} id
   * @returns {Promise<{ data: Affectation, message: string }>}
   */
  confirmer: (id) => apiClient.patch(`/affectations/${id}/confirmer`),
};
