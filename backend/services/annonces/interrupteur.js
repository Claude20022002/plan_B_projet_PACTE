/**
 * Interrupteur des annonces écrites par les enseignants à leurs classes (plan multi-établissements,
 * fichier 14, lot EC-5 ; décision du 20 octobre 2026 : pas d'annonces d'enseignant pour le moment).
 * Le code d'envoi existait déjà : il reste, fermé par défaut. L'administration et les responsables
 * de filière (qui écrivent à leur filière, leurs niveaux et leurs groupes) ne sont pas concernés ;
 * tout le monde continue de lire les annonces reçues. Le site a son propre interrupteur
 * (shared/fonctions.js, ANNONCES_ENSEIGNANTS_ACTIVES) : les deux se rallument ensemble. Il sera
 * remplacé par la fonctionnalité de chaque établissement (D-04) quand elle existera.
 */

/** Message rendu à un enseignant qui écrit à une classe alors que l'envoi est fermé. */
export const MESSAGE_CLASSES_FERMEES = "L'envoi d'annonces aux classes est indisponible pour le moment";

/**
 * Lu à chaque appel, et non au chargement du module, pour qu'un test puisse fermer puis rouvrir
 * l'envoi. Éteint par défaut : seule la valeur « true » l'ouvre.
 * @returns {boolean} vrai si les enseignants peuvent écrire à leurs classes
 */
export const annoncesEnseignantsActives = () => process.env.ANNONCES_ENSEIGNANTS_ACTIVES === "true";
