/**
 * auth.api.js
 * Authentification : login, logout, refresh, reset password.
 *
 * @typedef {Object} LoginPayload
 * @property {string} email
 * @property {string} password
 *
 * @typedef {Object} AuthResponse
 * @property {boolean} success
 * @property {User}    user
 *
 * @typedef {Object} User
 * @property {number} id_user
 * @property {string} nom
 * @property {string} prenom
 * @property {string} email
 * @property {string} role  - 'admin' | 'enseignant' | 'etudiant'
 * @property {boolean} actif
 * @property {string|null} avatar_url
 */

import apiClient from '../apiClient.js';

export const authAPI = {
  /**
   * @param {LoginPayload} payload
   * @returns {Promise<AuthResponse>}
   */
  login: (payload) => apiClient.post('/auth/login', payload),

  /**
   * @param {{ nom: string, prenom: string, email: string, password: string, role?: string }} payload
   * @returns {Promise<AuthResponse>}
   */
  register: (payload) => apiClient.post('/auth/register', payload),

  /**
   * @returns {Promise<{ success: boolean }>}
   */
  logout: () => apiClient.post('/auth/logout'),

  /**
   * Vérifie le token courant et retourne l'utilisateur connecté.
   * @returns {Promise<{ user: User }>}
   */
  getMe: () => apiClient.get('/auth/me'),

  /**
   * Échange le refresh token contre un nouvel access token.
   * @returns {Promise<{ message: string }>}
   */
  refreshToken: () => apiClient.post('/auth/refresh'),

  sessions: () => apiClient.get('/auth/sessions'),
  revokeSession: (sessionId) => apiClient.delete(`/auth/sessions/${sessionId}`),
  logoutAll: () => apiClient.post('/auth/logout-all'),

  /**
   * @param {string} email
   * @returns {Promise<{ message: string }>}
   */
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),

  /**
   * @param {{ token: string, id_user: number, password: string }} payload
   * @returns {Promise<{ message: string }>}
   */
  resetPassword: (payload) => apiClient.post('/auth/reset-password', payload),
};
