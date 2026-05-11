/**
 * errors.js
 * Système d'erreurs centralisé — typé, extensible, TypeScript-ready.
 *
 * Convention :
 *   - AppError : classe d'erreur principale
 *   - ERROR_CODES : enum des codes internes
 *   - isAppError() : type guard
 *   - getUserMessage() : message humain à afficher dans les Toasts
 */

// ── Codes d'erreur internes ────────────────────────────────────────────────
/**
 * @readonly
 * @enum {string}
 */
export const ERROR_CODES = Object.freeze({
  // Réseau
  NETWORK:       'NETWORK_ERROR',
  TIMEOUT:       'TIMEOUT',
  CANCELLED:     'CANCELLED',
  // Auth
  UNAUTHORIZED:  'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  FORBIDDEN:     'FORBIDDEN',
  // Ressources
  NOT_FOUND:     'NOT_FOUND',
  CONFLICT:      'CONFLICT',
  // Validation
  VALIDATION:    'VALIDATION_ERROR',
  // Serveur
  SERVER:        'SERVER_ERROR',
  UNAVAILABLE:   'SERVICE_UNAVAILABLE',
  RATE_LIMIT:    'RATE_LIMIT',
  // Divers
  UNKNOWN:       'UNKNOWN_ERROR',
});

// ── Classe d'erreur principale ────────────────────────────────────────────
/**
 * Erreur applicative normalisée.
 * Compatible TypeScript : propriétés explicites, extends Error.
 */
export class AppError extends Error {
  /**
   * @param {string} message          - Message technique
   * @param {string} code             - ERROR_CODES value
   * @param {number} [status]         - Code HTTP (0 si réseau)
   * @param {unknown} [data]          - Données brutes de la réponse
   */
  constructor(message, code, status = 0, data = null) {
    super(message);
    this.name       = 'AppError';
    this.code       = code;
    this.status     = status;
    this.data       = data;
    this.timestamp  = new Date().toISOString();
    // Flag spécial pour les erreurs réseau
    this.isConnectionError = code === ERROR_CODES.NETWORK;

    // Compatibilité stack trace ES2015+
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /** @returns {boolean} L'erreur est récupérable (retry possible) */
  get isRetryable() {
    return (
      this.isConnectionError ||
      this.code === ERROR_CODES.TIMEOUT ||
      this.status >= 500
    );
  }

  /** @returns {boolean} L'erreur est due à l'authentification */
  get isAuthError() {
    return this.status === 401 || this.code === ERROR_CODES.UNAUTHORIZED;
  }

  /** @returns {boolean} L'erreur est due à une permission */
  get isPermissionError() {
    return this.status === 403 || this.code === ERROR_CODES.FORBIDDEN;
  }
}

// ── Type guard ────────────────────────────────────────────────────────────
/**
 * @param {unknown} error
 * @returns {error is AppError}
 */
export function isAppError(error) {
  return error instanceof AppError;
}

// ── Messages utilisateur ──────────────────────────────────────────────────
/** @type {Record<string, string>} */
const USER_MESSAGES = {
  [ERROR_CODES.NETWORK]:      'Impossible de joindre le serveur. Vérifiez votre connexion.',
  [ERROR_CODES.TIMEOUT]:      'La requête a pris trop de temps. Réessayez.',
  [ERROR_CODES.CANCELLED]:    'Requête annulée.',
  [ERROR_CODES.UNAUTHORIZED]: 'Session expirée. Veuillez vous reconnecter.',
  [ERROR_CODES.TOKEN_EXPIRED]:'Session expirée. Reconnexion en cours...',
  [ERROR_CODES.FORBIDDEN]:    "Vous n'avez pas les droits nécessaires.",
  [ERROR_CODES.NOT_FOUND]:    'La ressource demandée est introuvable.',
  [ERROR_CODES.CONFLICT]:     'Un élément avec ces informations existe déjà.',
  [ERROR_CODES.VALIDATION]:   'Les données envoyées sont invalides.',
  [ERROR_CODES.SERVER]:       'Une erreur serveur est survenue. Réessayez plus tard.',
  [ERROR_CODES.UNAVAILABLE]:  'Le service est temporairement indisponible.',
  [ERROR_CODES.RATE_LIMIT]:   'Trop de requêtes. Attendez quelques secondes.',
  [ERROR_CODES.UNKNOWN]:      'Une erreur inattendue est survenue.',
};

/**
 * Retourne un message lisible par un utilisateur final.
 * Priorité : message serveur spécifique → message générique par code.
 *
 * @param {unknown} error
 * @returns {string}
 */
export function getUserMessage(error) {
  if (!isAppError(error)) {
    return error?.message || USER_MESSAGES[ERROR_CODES.UNKNOWN];
  }

  // Les erreurs de validation ont souvent un message spécifique du backend
  const isGenericMessage = Object.values(USER_MESSAGES).includes(error.message);
  if (!isGenericMessage && error.message && error.code !== ERROR_CODES.SERVER) {
    return error.message;
  }

  return USER_MESSAGES[error.code] || USER_MESSAGES[ERROR_CODES.UNKNOWN];
}

/**
 * Retourne les erreurs de champs (validation backend → formik).
 * @param {unknown} error
 * @returns {Record<string, string> | null}
 */
export function getFieldErrors(error) {
  if (!isAppError(error)) return null;
  if (error.code !== ERROR_CODES.VALIDATION) return null;
  return error.data?.fields || null;
}
