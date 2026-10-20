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
 * Les créneaux d'une séance qui tiennent dans ce qui reste du volume, dans l'ordre : la dernière
 * séance est raccourcie plutôt que de dépasser le volume prévu (un vacataire est payé à l'heure).
 * Vide si même le premier créneau dépasse le reste.
 */
export const creneauxDansLeVolume = (creneaux, resteHeures) => {
    const retenus = [];
    let total = 0;
    for (const creneau of creneaux) {
        total += dureeHeures(creneau);
        if (total > resteHeures + 1e-6) break;
        retenus.push(creneau);
    }
    return retenus;
};

export const heuresDe = (creneaux) => creneaux.reduce((t, c) => t + dureeHeures(c), 0);
