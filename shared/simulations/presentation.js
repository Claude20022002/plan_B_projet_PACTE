/**
 * Registre de présentation des simulations, partagé par les écrans web et natifs.
 * Chaque moteur a son module dans ./presentations/<moteur>.js ; le dispatch garde les
 * retombées d'avant (champs « stock », tableaux/résumé « seuil ») pour tout moteur inconnu.
 */
import { lireTexte } from './presentations/_aide.js';
import robot from './presentations/robot.js';
import seuil from './presentations/seuil.js';
import stock from './presentations/stock.js';
import triage from './presentations/triage.js';
import sql from './presentations/sql.js';
import reseau from './presentations/reseau.js';
import cpu from './presentations/cpu.js';
import sprint from './presentations/sprint.js';
import budget from './presentations/budget.js';
import complexite from './presentations/complexite.js';

const REGISTRE = { robot, seuil, stock, triage, sql, reseau, cpu, sprint, budget, complexite };

/** Décrit les champs de saisie sans évaluer ni convertir les valeurs vides. */
export function champsSimulation(jeu, defi, t, langue = 'fr', bilingue = (u) => lireTexte(u, langue)) {
    const p = REGISTRE[jeu.moteur] ?? stock;
    return p.champs(defi, t, langue, bilingue);
}

/** Donne à une case son symbole visible et une description accessible indépendante de la couleur. */
export function caseRobot(defi, x, y, resultat, t) {
    const ici = (p) => p[0] === x && p[1] === y;
    const type = ici(defi.depart) ? 'depart' : ici(defi.arrivee) ? 'arrivee'
        : defi.obstacles.some(ici) ? 'obstacle' : defi.passages.some(ici) ? 'passage' : 'libre';
    const visite = resultat?.trajet?.some(ici);
    const symbole = { depart: 'D', arrivee: 'A', obstacle: '#', passage: 'P', libre: visite ? '·' : '' }[type];
    return { type, symbole, visite, label: `${x + 1}, ${y + 1}: ${t(type)}${visite ? `, ${t('visite')}` : ''}` };
}

/** Renvoie les tableaux partagés entre les tableaux web accessibles aux lecteurs d'écran et les lignes natives. */
export function tableauxSimulation(jeu, defi, resultat, t, langue = 'fr', bilingue = (u) => lireTexte(u, langue)) {
    const p = REGISTRE[jeu.moteur] ?? seuil;
    return p.tableaux(defi, resultat, t, langue, bilingue);
}

/** Explique les résultats mesurés ; un dénominateur de prédiction manquant n'affiche jamais une fausse précision. */
export function resumeSimulation(jeu, defi, resultat, t) {
    if (!resultat) return '';
    const p = REGISTRE[jeu.moteur] ?? seuil;
    return p.resume(defi, resultat, t);
}
