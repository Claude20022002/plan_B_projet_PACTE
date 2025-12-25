/**
 * Utilitaires pour la manipulation des dates
 */

/**
 * Formate une date au format français
 * @param {Date|string} date - Date à formater
 * @returns {string} - Date formatée (ex: "15 janvier 2024")
 */
export const formaterDateFR = (date) => {
    const d = new Date(date);
    const options = {
        year: "numeric",
        month: "long",
        day: "numeric",
    };
    return d.toLocaleDateString("fr-FR", options);
};

/**
 * Formate une date au format court français
 * @param {Date|string} date - Date à formater
 * @returns {string} - Date formatée (ex: "15/01/2024")
 */
export const formaterDateCourteFR = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString("fr-FR");
};

/**
 * Formate une heure au format français
 * @param {string} heure - Heure au format HH:MM
 * @returns {string} - Heure formatée (ex: "14h30")
 */
export const formaterHeureFR = (heure) => {
    if (!heure) return "";
    return heure.replace(":", "h");
};

/**
 * Vérifie si une date est dans le passé
 * @param {Date|string} date - Date à vérifier
 * @returns {boolean}
 */
export const estDatePassee = (date) => {
    const d = new Date(date);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    return d < aujourdhui;
};

/**
 * Vérifie si une date est aujourd'hui
 * @param {Date|string} date - Date à vérifier
 * @returns {boolean}
 */
export const estAujourdhui = (date) => {
    const d = new Date(date);
    const aujourdhui = new Date();
    return (
        d.getDate() === aujourdhui.getDate() &&
        d.getMonth() === aujourdhui.getMonth() &&
        d.getFullYear() === aujourdhui.getFullYear()
    );
};

/**
 * Vérifie si une date est dans le futur
 * @param {Date|string} date - Date à vérifier
 * @returns {boolean}
 */
export const estDateFuture = (date) => {
    const d = new Date(date);
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    return d > aujourdhui;
};

/**
 * Ajoute des jours à une date
 * @param {Date|string} date - Date de base
 * @param {number} jours - Nombre de jours à ajouter
 * @returns {Date} - Nouvelle date
 */
export const ajouterJours = (date, jours) => {
    const d = new Date(date);
    d.setDate(d.getDate() + jours);
    return d;
};

/**
 * Retire des jours à une date
 * @param {Date|string} date - Date de base
 * @param {number} jours - Nombre de jours à retirer
 * @returns {Date} - Nouvelle date
 */
export const retirerJours = (date, jours) => {
    return ajouterJours(date, -jours);
};

/**
 * Obtient le premier jour de la semaine pour une date donnée (lundi)
 * @param {Date|string} date - Date
 * @returns {Date} - Premier jour de la semaine
 */
export const getPremierJourSemaine = (date) => {
    const d = new Date(date);
    const jour = d.getDay();
    const diff = d.getDate() - jour + (jour === 0 ? -6 : 1); // Ajuster pour lundi
    return new Date(d.setDate(diff));
};

/**
 * Obtient le dernier jour de la semaine pour une date donnée (dimanche)
 * @param {Date|string} date - Date
 * @returns {Date} - Dernier jour de la semaine
 */
export const getDernierJourSemaine = (date) => {
    const premierJour = getPremierJourSemaine(date);
    return ajouterJours(premierJour, 6);
};

/**
 * Obtient toutes les dates d'une semaine pour une date donnée
 * @param {Date|string} date - Date
 * @returns {Array<Date>} - Liste des dates de la semaine
 */
export const getDatesSemaine = (date) => {
    const premierJour = getPremierJourSemaine(date);
    const dates = [];

    for (let i = 0; i < 7; i++) {
        dates.push(ajouterJours(premierJour, i));
    }

    return dates;
};

/**
 * Compare deux heures (format HH:MM)
 * @param {string} heure1 - Première heure
 * @param {string} heure2 - Deuxième heure
 * @returns {number} - -1 si heure1 < heure2, 0 si égales, 1 si heure1 > heure2
 */
export const comparerHeures = (heure1, heure2) => {
    const [h1, m1] = heure1.split(":").map(Number);
    const [h2, m2] = heure2.split(":").map(Number);

    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;

    if (minutes1 < minutes2) return -1;
    if (minutes1 > minutes2) return 1;
    return 0;
};

/**
 * Calcule la durée entre deux heures en minutes
 * @param {string} heureDebut - Heure de début (HH:MM)
 * @param {string} heureFin - Heure de fin (HH:MM)
 * @returns {number} - Durée en minutes
 */
export const calculerDuree = (heureDebut, heureFin) => {
    const [h1, m1] = heureDebut.split(":").map(Number);
    const [h2, m2] = heureFin.split(":").map(Number);

    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;

    return minutes2 - minutes1;
};
