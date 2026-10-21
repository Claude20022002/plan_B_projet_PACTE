import { minutes } from "../../planning/affectationRules.js";

/**
 * Règles de date et de volume du déploiement de la semaine type (recette du 20 octobre, M-1 et M-2),
 * à part pour pouvoir les tester sans base de données.
 */

export const ajouterJours = (iso, n) => {
    const d = new Date(`${iso}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
};

/**
 * Première date où une séance peut être créée. Jamais dans le passé, ni aujourd'hui : les créneaux
 * du jour sont déjà passés ou en cours, et une séance passée devient « réalisée » sans appel.
 */
export const debutDeploiement = (dateDebutPeriode, aujourdhui) =>
    dateDebutPeriode > aujourdhui ? dateDebutPeriode : ajouterJours(aujourdhui, 1);

const dureeHeures = (creneau) => (minutes(creneau.heure_fin) - minutes(creneau.heure_debut)) / 60;

/**
 * Les créneaux d'une séance nécessaires pour atteindre ce qui reste du volume, dans l'ordre : on
 * s'arrête dès que le reste est couvert. Un reste plus court qu'un créneau est placé quand même
 * (décision du 21 octobre : le dépassement est accepté), il ne dépasse donc jamais d'un créneau
 * entier. Vide si le volume est déjà atteint.
 */
export const creneauxDansLeVolume = (creneaux, resteHeures) => {
    const retenus = [];
    let total = 0;
    for (const creneau of creneaux) {
        if (total >= resteHeures - 1e-6) break;
        retenus.push(creneau);
        total += dureeHeures(creneau);
    }
    return retenus;
};

export const heuresDe = (creneaux) => creneaux.reduce((t, c) => t + dureeHeures(c), 0);
