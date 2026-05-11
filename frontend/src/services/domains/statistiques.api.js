import apiClient, { buildParams } from '../apiClient.js';

/**
 * @typedef {Object} DateRangeParams
 * @property {string} [date_debut]
 * @property {string} [date_fin]
 */

export const statistiquesAPI = {
  /** Dashboard global (nombre users, affectations, salles...) */
  getDashboard:        (params) => apiClient.get(`/statistiques/dashboard?${buildParams(params)}`),
  /** 7 KPIs analytics (occupation salles, charge enseignants, taux conflits...) */
  getKPIs:             (params) => apiClient.get(`/statistiques/kpis?${buildParams(params)}`),
  /** Taux d'occupation par salle */
  getOccupationSalles: (params) => apiClient.get(`/statistiques/salles/occupation?${buildParams(params)}`),
  /** Charge horaire par enseignant */
  getChargeEnseignants:(params) => apiClient.get(`/statistiques/enseignants/charge?${buildParams(params)}`),
  /** Volume horaire par groupe */
  getOccupationGroupes:(params) => apiClient.get(`/statistiques/groupes/occupation?${buildParams(params)}`),
  /** Créneaux les plus chargés */
  getPicsActivite:     (params) => apiClient.get(`/statistiques/activite/pics?${buildParams(params)}`),
};
