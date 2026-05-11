import apiClient, { buildParams } from '../apiClient.js';

/**
 * @typedef {Object} Salle
 * @property {number}  id_salle
 * @property {string}  nom_salle
 * @property {string}  type_salle
 * @property {number}  capacite
 * @property {string}  batiment
 * @property {number}  [etage]
 * @property {string}  [equipements]
 * @property {boolean} disponible
 */

export const sallesAPI = {
  /**
   * @param {{ page?: number, limit?: number, search?: string }} [params]
   * @returns {Promise<PaginatedResponse<Salle>>}
   */
  getAll: (params) => apiClient.get(`/salles?${buildParams(params)}`),

  /** @param {number} id @returns {Promise<{ data: Salle }>} */
  getById: (id) => apiClient.get(`/salles/${id}`),

  /**
   * Salles disponibles pour un créneau/date donné.
   * @param {{ id_creneau: number, date_seance: string, capacite_min?: number }} params
   */
  getDisponibles: (params) => apiClient.get(`/salles/disponibles/liste?${buildParams(params)}`),

  /** @param {Omit<Salle, 'id_salle'>} data */
  create: (data) => apiClient.post('/salles', data),

  /** @param {number} id @param {Partial<Salle>} data */
  update: (id, data) => apiClient.put(`/salles/${id}`, data),

  /** @param {number} id */
  delete: (id) => apiClient.delete(`/salles/${id}`),
};
