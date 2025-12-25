import bcrypt from "bcryptjs";

/**
 * Utilitaires pour la gestion des mots de passe
 */

/**
 * Hash un mot de passe
 * @param {string} password - Mot de passe en clair
 * @param {number} saltRounds - Nombre de rounds de salage (défaut: 10)
 * @returns {Promise<string>} - Mot de passe hashé
 */
export const hashPassword = async (password, saltRounds = 10) => {
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        return hashedPassword;
    } catch (error) {
        console.error("Erreur lors du hashage du mot de passe:", error);
        throw error;
    }
};

/**
 * Compare un mot de passe en clair avec un hash
 * @param {string} password - Mot de passe en clair
 * @param {string} hashedPassword - Mot de passe hashé
 * @returns {Promise<boolean>} - True si les mots de passe correspondent
 */
export const comparePassword = async (password, hashedPassword) => {
    try {
        const isMatch = await bcrypt.compare(password, hashedPassword);
        return isMatch;
    } catch (error) {
        console.error(
            "Erreur lors de la comparaison des mots de passe:",
            error
        );
        throw error;
    }
};

/**
 * Génère un mot de passe aléatoire
 * @param {number} length - Longueur du mot de passe (défaut: 12)
 * @returns {string} - Mot de passe généré
 */
export const generateRandomPassword = (length = 12) => {
    const charset =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }

    return password;
};

/**
 * Valide la force d'un mot de passe
 * @param {string} password - Mot de passe à valider
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export const validatePasswordStrength = (password) => {
    const errors = [];

    if (password.length < 8) {
        errors.push("Le mot de passe doit contenir au moins 8 caractères");
    }

    if (!/[a-z]/.test(password)) {
        errors.push("Le mot de passe doit contenir au moins une minuscule");
    }

    if (!/[A-Z]/.test(password)) {
        errors.push("Le mot de passe doit contenir au moins une majuscule");
    }

    if (!/[0-9]/.test(password)) {
        errors.push("Le mot de passe doit contenir au moins un chiffre");
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push(
            "Le mot de passe doit contenir au moins un caractère spécial"
        );
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};
