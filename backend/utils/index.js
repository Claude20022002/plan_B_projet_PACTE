/**
 * Export centralisé de tous les utilitaires
 */

// Détection de conflits
export {
    detecterConflitsPourAffectation,
    creerConflit,
    verifierEtCreerConflits,
} from "./detectConflicts.js";

// Envoi d'emails
export {
    sendEmail,
    sendAffectationNotification,
    sendConflitNotification,
    sendDemandeReportNotification,
    sendReportConfirmation,
    sendAnnulationSeance,
} from "./sendEmail.js";

// Notifications
export {
    creerNotification,
    creerNotificationsMultiples,
    notifierAdministrateurs,
    notifierNouvelleAffectation,
    notifierConflit,
    notifierDemandeReport,
    notifierEtudiantsGroupe,
    marquerToutesCommeLues,
} from "./notificationHelper.js";

// Dates
export {
    formaterDateFR,
    formaterDateCourteFR,
    formaterHeureFR,
    estDatePassee,
    estAujourdhui,
    estDateFuture,
    ajouterJours,
    retirerJours,
    getPremierJourSemaine,
    getDernierJourSemaine,
    getDatesSemaine,
    comparerHeures,
    calculerDuree,
} from "./dateHelper.js";

// Mots de passe
export {
    hashPassword,
    comparePassword,
    empreinteARenouveler,
    reglesMotDePasse,
    verifierMotDePasse,
} from "./passwordHelper.js";

// Validations
export {
    isValidEmail,
    isValidPhoneFR,
    isValidCodeFiliere,
    isValidNumeroEtudiant,
    isValidCapacite,
    isValidVolumeHoraire,
    isValidCoefficient,
    isValidDateISO,
    isValidHeure,
    isValidJourSemaine,
    sanitizeString,
    isValidName,
    isValidRole,
} from "./validationHelper.js";

// Pagination
export {
    getPaginationParams,
    createPaginationResponse,
} from "./paginationHelper.js";

