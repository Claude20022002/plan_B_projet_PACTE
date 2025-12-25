/**
 * Utilitaires pour des validations supplémentaires
 */

/**
 * Valide un email
 * @param {string} email - Email à valider
 * @returns {boolean} - True si l'email est valide
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Valide un numéro de téléphone français
 * @param {string} telephone - Numéro de téléphone
 * @returns {boolean} - True si le numéro est valide
 */
export const isValidPhoneFR = (telephone) => {
    // Format: 10 chiffres, peut commencer par 0 ou +33
    const phoneRegex = /^(?:(?:\+|00)33|0)[1-9](?:[0-9]{8})$/;
    return phoneRegex.test(telephone.replace(/\s/g, ""));
};

/**
 * Valide un code de filière (format: lettres et chiffres)
 * @param {string} code - Code à valider
 * @returns {boolean} - True si le code est valide
 */
export const isValidCodeFiliere = (code) => {
    // Format: lettres majuscules et chiffres, 3-10 caractères
    const codeRegex = /^[A-Z0-9]{3,10}$/;
    return codeRegex.test(code);
};

/**
 * Valide un numéro d'étudiant
 * @param {string} numero - Numéro d'étudiant
 * @returns {boolean} - True si le numéro est valide
 */
export const isValidNumeroEtudiant = (numero) => {
    // Format: lettres et chiffres, 5-15 caractères
    const numeroRegex = /^[A-Z0-9]{5,15}$/;
    return numeroRegex.test(numero.toUpperCase());
};

/**
 * Valide une capacité de salle
 * @param {number} capacite - Capacité
 * @returns {boolean} - True si la capacité est valide
 */
export const isValidCapacite = (capacite) => {
    return Number.isInteger(capacite) && capacite > 0 && capacite <= 1000;
};

/**
 * Valide un volume horaire
 * @param {number} volumeHoraire - Volume horaire en heures
 * @returns {boolean} - True si le volume est valide
 */
export const isValidVolumeHoraire = (volumeHoraire) => {
    return (
        Number.isInteger(volumeHoraire) &&
        volumeHoraire > 0 &&
        volumeHoraire <= 200
    );
};

/**
 * Valide un coefficient
 * @param {number} coefficient - Coefficient
 * @returns {boolean} - True si le coefficient est valide
 */
export const isValidCoefficient = (coefficient) => {
    return (
        typeof coefficient === "number" && coefficient > 0 && coefficient <= 10
    );
};

/**
 * Valide une date au format ISO (YYYY-MM-DD)
 * @param {string} date - Date à valider
 * @returns {boolean} - True si la date est valide
 */
export const isValidDateISO = (date) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
        return false;
    }

    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
};

/**
 * Valide une heure au format HH:MM
 * @param {string} heure - Heure à valider
 * @returns {boolean} - True si l'heure est valide
 */
export const isValidHeure = (heure) => {
    const heureRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return heureRegex.test(heure);
};

/**
 * Valide un jour de la semaine
 * @param {string} jour - Jour à valider
 * @returns {boolean} - True si le jour est valide
 */
export const isValidJourSemaine = (jour) => {
    const joursValides = [
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi",
        "dimanche",
    ];
    return joursValides.includes(jour.toLowerCase());
};

/**
 * Nettoie et normalise une chaîne de caractères
 * @param {string} str - Chaîne à nettoyer
 * @returns {string} - Chaîne nettoyée
 */
export const sanitizeString = (str) => {
    if (typeof str !== "string") return "";
    return str.trim().replace(/\s+/g, " ");
};

/**
 * Valide un nom (prénom, nom de famille)
 * @param {string} nom - Nom à valider
 * @returns {boolean} - True si le nom est valide
 */
export const isValidName = (nom) => {
    if (!nom || typeof nom !== "string") return false;
    const trimmed = nom.trim();
    return trimmed.length >= 2 && trimmed.length <= 50;
};

/**
 * Valide un rôle utilisateur
 * @param {string} role - Rôle à valider
 * @returns {boolean} - True si le rôle est valide
 */
export const isValidRole = (role) => {
    const rolesValides = ["admin", "enseignant", "etudiant"];
    return rolesValides.includes(role);
};
