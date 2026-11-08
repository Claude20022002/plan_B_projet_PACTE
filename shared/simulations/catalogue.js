/**
 * Index du catalogue des simulations : un fichier par simulation dans ./catalogue/.
 * L'ordre est significatif (les tests le déstructurent positionnellement) ; les IDs sont stables
 * car la maîtrise est enregistrée contre eux.
 */
import robotRoute from './catalogue/robot-route.js';
import thresholdLab from './catalogue/threshold-lab.js';
import stockPilot from './catalogue/stock-pilot.js';
import triCyber from './catalogue/tri-cyber.js';
import queteSql from './catalogue/quete-sql.js';
import topoReseau from './catalogue/topo-reseau.js';
import cpuProcess from './catalogue/cpu-process.js';
import sprintAgile from './catalogue/sprint-agile.js';
import budgetErp from './catalogue/budget-erp.js';
import bigOLab from './catalogue/big-o-lab.js';

export const SIMULATIONS = [
    robotRoute,
    thresholdLab,
    stockPilot,
    triCyber,
    queteSql,
    topoReseau,
    cpuProcess,
    sprintAgile,
    budgetErp,
    bigOLab,
];

/** Renvoie une simulation connue, ou null ; n'accepte jamais un nom de moteur arbitraire. */
export const simulationParCode = (code) => SIMULATIONS.find((jeu) => jeu.code === code) ?? null;
