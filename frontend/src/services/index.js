/**
 * services/index.js
 * Point d'entrée unique pour tous les services.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * MIGRATION GUIDE — api.js → nouvelle architecture
 * ─────────────────────────────────────────────────────────────────────────
 *
 * Ancienne syntaxe :
 *   import { affectationAPI } from '../../services/api';
 *   affectationAPI.getAll(params)
 *
 * Nouvelle syntaxe (React Query recommandé) :
 *   import { useAffectations } from '@/services/queries';
 *   const { data, isLoading } = useAffectations(params);
 *
 * Ou accès direct à l'API (pour les mutations, exports...) :
 *   import { affectationsAPI } from '@/services/domains';
 *   const result = await affectationsAPI.create(payload);
 *
 * ─────────────────────────────────────────────────────────────────────────
 * RÉTRO-COMPATIBILITÉ — Pour migrer page par page sans tout casser
 * ─────────────────────────────────────────────────────────────────────────
 * Les exports ci-dessous reproduisent les noms de l'ancien api.js.
 * Supprimer progressivement au profit des imports depuis 'domains'.
 */

// ── Infrastructure ────────────────────────────────────────────────────────
export { default as apiClient }   from './apiClient.js';
export { default as queryClient } from './queryClient.js';
export { invalidateDomain, invalidateDomains, prefetchQuery } from './queryClient.js';
export { AppError, ERROR_CODES, isAppError, getUserMessage, getFieldErrors } from './errors.js';

// ── Domaines API ──────────────────────────────────────────────────────────
export * from './domains/index.js';

// ── React Query hooks ─────────────────────────────────────────────────────
export * from './queries/index.js';

// ── Aliases rétro-compatibles avec api.js (dépréciation progressive) ─────
export { authAPI }           from './domains/auth.api.js';
export { usersAPI as userAPI }          from './domains/users.api.js';
export { enseignantsAPI as enseignantAPI } from './domains/enseignants.api.js';
export { etudiantsAPI as etudiantAPI }   from './domains/etudiants.api.js';
export { filieresAPI as filiereAPI }     from './domains/filieres.api.js';
export { groupesAPI as groupeAPI }       from './domains/groupes.api.js';
export { sallesAPI as salleAPI }         from './domains/salles.api.js';
export { coursAPI }          from './domains/cours.api.js';
export { creneauxAPI as creneauAPI }     from './domains/creneaux.api.js';
export { affectationsAPI as affectationAPI } from './domains/affectations.api.js';
export { conflitsAPI as conflitAPI }     from './domains/conflits.api.js';
export { notificationsAPI as notificationAPI } from './domains/notifications.api.js';
export { statistiquesAPI }   from './domains/statistiques.api.js';
export { disponibilitesAPI as disponibiliteAPI } from './domains/disponibilites.api.js';
export { demandesReportAPI as demandeReportAPI } from './domains/demandesReport.api.js';
export { emploiDuTempsAPI }  from './domains/emploiDuTemps.api.js';
export { generationAPI as generationAutomatiqueAPI } from './domains/generation.api.js';
