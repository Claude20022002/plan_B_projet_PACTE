/**
 * domains/index.js
 * Re-export de tous les modules API par domaine.
 * Permet : import { affectationsAPI, conflitsAPI } from '@/services/domains'
 */

export { authAPI }               from './auth.api.js';
export { usersAPI }              from './users.api.js';
export { enseignantsAPI }        from './enseignants.api.js';
export { etudiantsAPI }          from './etudiants.api.js';
export { filieresAPI }           from './filieres.api.js';
export { groupesAPI }            from './groupes.api.js';
export { sallesAPI }             from './salles.api.js';
export { coursAPI }              from './cours.api.js';
export { creneauxAPI }           from './creneaux.api.js';
export { affectationsAPI }       from './affectations.api.js';
export { conflitsAPI }           from './conflits.api.js';
export { notificationsAPI }      from './notifications.api.js';
export { statistiquesAPI }       from './statistiques.api.js';
export { disponibilitesAPI }     from './disponibilites.api.js';
export { demandesReportAPI }     from './demandesReport.api.js';
export { emploiDuTempsAPI }      from './emploiDuTemps.api.js';
export { generationAPI }         from './generation.api.js';
