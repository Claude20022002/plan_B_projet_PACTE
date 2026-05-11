/**
 * users.api.js
 * Gestion des utilisateurs (admin uniquement).
 *
 * @typedef {Object} UserCreatePayload
 * @property {string}  nom
 * @property {string}  prenom
 * @property {string}  email
 * @property {string}  password
 * @property {'admin'|'enseignant'|'etudiant'} role
 * @property {string}  [telephone]
 * @property {boolean} [actif]
 *
 * @typedef {Object} PaginatedResponse
 * @property {Array}  data
 * @property {{ total: number, page: number, limit: number, totalPages: number }} pagination
 * @property {string} message
 */

import apiClient, { buildParams } from '../apiClient.js';

export const usersAPI = {
  /**
   * @param {{ page?: number, limit?: number, role?: string, search?: string }} [params]
   * @returns {Promise<PaginatedResponse>}
   */
  getAll: (params) => apiClient.get(`/users?${buildParams(params)}`),

  /**
   * @param {number} id
   * @returns {Promise<{ data: User }>}
   */
  getById: (id) => apiClient.get(`/users/${id}`),

  /**
   * @param {UserCreatePayload} payload
   * @returns {Promise<{ data: User, message: string }>}
   */
  create: (payload) => apiClient.post('/users', payload),

  /**
   * @param {number} id
   * @param {Partial<UserCreatePayload>} payload
   * @returns {Promise<{ data: User, message: string }>}
   */
  update: (id, payload) => apiClient.put(`/users/${id}`, payload),

  /**
   * @param {number} id
   * @returns {Promise<{ message: string }>}
   */
  delete: (id) => apiClient.delete(`/users/${id}`),

  /**
   * Import en masse depuis CSV/Excel.
   * @param {{ users: UserCreatePayload[] }} payload
   * @returns {Promise<{ successCount: number, errorCount: number, errors: Array }>}
   */
  importBulk: (payload) => apiClient.post('/users/import', payload),
};
