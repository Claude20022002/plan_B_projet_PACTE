/**
 * apiClient.js
 * Instance Axios centralisée — source unique de vérité pour toutes les requêtes.
 *
 * Responsabilités :
 *   - Injection automatique du token JWT (Bearer ou httpOnly cookie)
 *   - Refresh token automatique sur 401 TOKEN_EXPIRED
 *   - Retry intelligent sur erreurs réseau transitoires
 *   - Annulation de requêtes via AbortController
 *   - Normalisation des erreurs → AppError
 */

import axios from 'axios';
import { AppError, ERROR_CODES } from './errors.js';

// ── Configuration de base ──────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/** Nombre max de tentatives sur erreur réseau */
const MAX_RETRIES = 2;

/** Délai exponentiel entre les retries (ms) */
const RETRY_DELAY_BASE = 500;

// ── Création de l'instance ─────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
  // Activer lorsque JWT sera en httpOnly cookie :
  // withCredentials: true,
});

// ── Gestion du refresh token (queue anti-concurrence) ─────────────────────
let isRefreshing = false;
let failedQueue = [];

/** Résout ou rejette toutes les requêtes mises en attente pendant le refresh */
function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

// ── Intercepteur de requête : injecter le token ────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Lecture depuis localStorage (migrer vers cookie httpOnly en prod)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(normalizeError(error)),
);

// ── Intercepteur de réponse : refresh + normalisation erreurs ──────────────
apiClient.interceptors.response.use(
  // Succès : retourner directement data (pas besoin de .data partout)
  (response) => response.data,

  async (error) => {
    const originalRequest = error.config;

    // ── Refresh token automatique sur 401 TOKEN_EXPIRED ──────────────────
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        // Mise en file d'attente des requêtes concurrentes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          })
          .catch(Promise.reject);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { token } = await apiClient.post('/auth/refresh');
        localStorage.setItem('token', token);
        processQueue(null, token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        // Émettre un événement global pour que AuthContext redirige
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(normalizeError(refreshError));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(normalizeError(error));
  },
);

// ── Normalisation des erreurs Axios → AppError ────────────────────────────
/**
 * @param {unknown} error
 * @returns {AppError}
 */
function normalizeError(error) {
  if (error instanceof AppError) return error;

  // Erreur réseau (pas de réponse serveur)
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new AppError('La requête a expiré. Réessayez.', ERROR_CODES.TIMEOUT, 408);
    }
    if (axios.isCancel(error)) {
      return new AppError('Requête annulée', ERROR_CODES.CANCELLED, 0);
    }
    const connError = new AppError(
      'Impossible de joindre le serveur. Vérifiez votre connexion.',
      ERROR_CODES.NETWORK,
      0,
    );
    connError.isConnectionError = true;
    return connError;
  }

  const { status, data } = error.response;
  const message = data?.message || data?.error || `Erreur ${status}`;
  const code    = data?.code || httpStatusToCode(status);

  return new AppError(message, code, status, data);
}

/** Mappe les codes HTTP vers les codes internes */
function httpStatusToCode(status) {
  const map = {
    400: ERROR_CODES.VALIDATION,
    401: ERROR_CODES.UNAUTHORIZED,
    403: ERROR_CODES.FORBIDDEN,
    404: ERROR_CODES.NOT_FOUND,
    409: ERROR_CODES.CONFLICT,
    422: ERROR_CODES.VALIDATION,
    429: ERROR_CODES.RATE_LIMIT,
    500: ERROR_CODES.SERVER,
    503: ERROR_CODES.UNAVAILABLE,
  };
  return map[status] || ERROR_CODES.UNKNOWN;
}

// ── Helper : requête avec retry automatique ───────────────────────────────
/**
 * Exécute une fonction de requête avec retry exponentiel.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {number} [maxRetries]
 * @returns {Promise<T>}
 */
export async function withRetry(fn, maxRetries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable =
        error.isConnectionError ||
        error.code === ERROR_CODES.TIMEOUT ||
        (error.status >= 500 && error.status < 600);

      if (!isRetryable || attempt === maxRetries) throw error;

      const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ── Helper : construire les query params ──────────────────────────────────
/**
 * Transforme un objet de params en query string (ignore les valeurs nulles).
 * @param {Record<string, unknown>} params
 * @returns {string}
 */
export function buildParams(params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== ''),
  );
  return new URLSearchParams(clean).toString();
}

export default apiClient;
