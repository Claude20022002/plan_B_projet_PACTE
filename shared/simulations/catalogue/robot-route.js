/** Simulation « Robot Route » : programmation d'un trajet en grille (mécanique robot). */
import { texte, SOURCE } from './_aide.js';

export default {
    code: 'robot-route', type: 'simulation', discipline: 'robotique', moteur: 'robot',
    titre: texte('Robot Route', 'Robot Route'),
    resume: texte('Programmer un trajet, éviter les obstacles et vérifier chaque déplacement dans une grille simulée.', 'Program a route, avoid obstacles, and inspect every move in a simulated grid.'),
    objectif: texte('Décomposer un trajet en instructions et tester des contraintes de sécurité.', 'Decompose a route into instructions and test safety constraints.'),
    source: null,
    curriculum: { url: SOURCE.robot, titre: texte('Robotique & Industrie 4.0', 'Robotics & Industry 4.0'), consulteLe: '2026-10-16' },
    defis: [
        {
            id: 'robot-01', niveau: 1, xp: 100,
            titre: texte('Première livraison', 'First delivery'),
            consigne: texte('Atteindre (4, 4) depuis (1, 1) sans obstacle, en 6 déplacements maximum.', 'Reach (4, 4) from (1, 1) without hitting obstacles, in at most 6 moves.'),
            indice: texte('Il faut trois déplacements vers l’est et trois vers le sud. Choisir un couloir libre.', 'You need three moves east and three south. Choose a clear corridor.'),
            bilan: texte('Tester les limites et les obstacles fait partie de la validation d’un programme, même si la destination est correcte.', 'Boundary and obstacle checks are part of program validation, even when the destination is correct.'),
            taille: 4, depart: [0, 0], arrivee: [3, 3], obstacles: [[1, 1], [2, 1]], passages: [], maxPas: 6,
        },
        {
            id: 'robot-02', niveau: 2, xp: 150,
            titre: texte('Passage obligatoire', 'Required checkpoint'),
            consigne: texte('Atteindre (5, 5), passer par (1, 4) et contourner la cloison en 10 déplacements maximum.', 'Reach (5, 5), visit (1, 4), and go around the partition in at most 10 moves.'),
            indice: texte('La cloison laisse un passage sur la dernière ligne. Le point de contrôle est à gauche.', 'The partition has a gap on the last row. The checkpoint is on the left.'),
            bilan: texte('Un test de destination seul ne suffit pas : les points de passage doivent aussi être vérifiés.', 'A destination check is insufficient: required checkpoints must also be verified.'),
            taille: 5, depart: [0, 0], arrivee: [4, 4], obstacles: [[2, 0], [2, 1], [2, 2], [2, 3]], passages: [[0, 3]], maxPas: 10,
        },
        {
            id: 'robot-03', niveau: 3, xp: 200,
            titre: texte('Trajet sous contrainte', 'Constrained route'),
            consigne: texte('Atteindre (6, 6) via (4, 5), entre deux cloisons, en 16 déplacements maximum.', 'Reach (6, 6) via (4, 5), between two partitions, in at most 16 moves.'),
            indice: texte('Contourner la première cloison par le bas, puis la seconde par le haut.', 'Go below the first partition, then above the second.'),
            bilan: texte('Les obstacles imposent un détour. Une distance à vol d’oiseau ne garantit pas un trajet réalisable.', 'Obstacles force a detour. Straight-line distance does not guarantee a feasible route.'),
            taille: 6, depart: [0, 0], arrivee: [5, 5], obstacles: [[2, 0], [2, 1], [2, 2], [2, 3], [4, 2], [4, 3], [4, 4], [4, 5]], passages: [[3, 4]], maxPas: 16,
        },
    ],
};
