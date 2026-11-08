/**
 * Registre des moteurs de simulation déterministes et bornés.
 * Aucun code utilisateur, SQL, shell ni matériel de robot n'est exécuté.
 * Chaque moteur vit dans ./moteurs/<nom>.js et expose { valider, evaluer, formulaire }.
 */
import { nombre } from './moteurs/_aides.js';
import robot from './moteurs/robot.js';
import seuil from './moteurs/seuil.js';
import stock from './moteurs/stock.js';
import triage from './moteurs/triage.js';
import sql from './moteurs/sql.js';
import reseau from './moteurs/reseau.js';
import cpu from './moteurs/cpu.js';
import sprint from './moteurs/sprint.js';
import budget from './moteurs/budget.js';
import complexite from './moteurs/complexite.js';

const REGISTRE = { robot, seuil, stock, triage, sql, reseau, cpu, sprint, budget, complexite };

/** Valide la forme exacte de la requête avant toute simulation ; une saisie vide ne devient jamais zéro. */
export function reponseValide(moteur, reponse) {
    if (!reponse || typeof reponse !== 'object' || Array.isArray(reponse)) return false;
    const moteur_ = REGISTRE[moteur];
    if (!moteur_) return false;
    return moteur_.valider(Object.keys(reponse), reponse);
}

/** Renvoie un retour objectif à partir des données canoniques du défi, ou null si la saisie est invalide. */
export function evaluerSimulation(jeu, defi, reponse) {
    if (!jeu || !defi || !reponseValide(jeu.moteur, reponse)) return null;
    return REGISTRE[jeu.moteur].evaluer(defi, reponse);
}

/** Convertit les chaînes du formulaire seulement si elles sont complètes ; saisie invalide reste discernable. */
export function reponseDuFormulaire(moteur, valeurs) {
    const moteur_ = REGISTRE[moteur];
    if (moteur_?.formulaire) return moteur_.formulaire(valeurs);
    return { commandes: [0, 1, 2].map((i) => nombre(valeurs[`jour${i}`])) };
}
