/** Simulation « Ordonnanceur CPU » : ordre d'exécution de processus sous échéances (mécanique cpu). */
import { texte, SOURCE } from './_aide.js';

export default {
    code: 'cpu-process', type: 'simulation', discipline: 'systemes-d-exploitation', moteur: 'cpu',
    titre: texte('Ordonnanceur CPU', 'CPU Scheduler'),
    resume: texte('Choisir l’ordre d’exécution de 4 processus pour respecter les échéances et minimiser le temps de rotation moyen.', 'Choose the execution order of 4 processes to meet deadlines and minimise average turnaround time.'),
    objectif: texte('Comprendre l’ordonnancement non préemptif et ses compromis (FCFS, SJF, priorité).', 'Understand non-preemptive scheduling and its trade-offs (FCFS, SJF, priority).'),
    source: null,
    curriculum: { url: SOURCE.si, titre: texte('Informatique : Systèmes d’exploitation', 'Computer Science: Operating Systems'), consulteLe: '2026-10-16' },
    defis: [
        {
            id: 'cpu-01', niveau: 1, xp: 100,
            titre: texte('Deux tâches simples', 'Two simple tasks'),
            consigne: texte('Ordonnancer 4 processus (index 0-3) sans dépasser aucune échéance. Moyenne de rotation ≤ 18.', 'Schedule 4 processes (index 0–3) without missing any deadline. Average turnaround ≤ 18.'),
            indice: texte('Commencer par le processus qui arrive en premier (arrivee=0).', 'Start with the process that arrives first (arrival=0).'),
            bilan: texte('Un ordonnancement FCFS (premier arrivé, premier exécuté) n’est pas toujours optimal pour les échéances.', 'FCFS scheduling is not always optimal for deadline compliance.'),
            processus: [
                { nom: 'P1', arrivee: 0, duree: 4, echeance: 10 },
                { nom: 'P2', arrivee: 0, duree: 3, echeance: 8 },
                { nom: 'P3', arrivee: 2, duree: 5, echeance: 20 },
                { nom: 'P4', arrivee: 3, duree: 2, echeance: 15 },
            ], moyenneMax: 18,
        },
        {
            id: 'cpu-02', niveau: 2, xp: 150,
            titre: texte('Échéances serrées', 'Tight deadlines'),
            consigne: texte('Placer 4 processus pour que chacun finisse avant son échéance. Moyenne de rotation ≤ 14.', 'Order 4 processes so each finishes before its deadline. Average turnaround ≤ 14.'),
            indice: texte('P2 a une échéance à t=7 et dure 3 ; il doit démarrer au plus tard à t=4.', 'P2 has deadline t=7 and duration 3; it must start no later than t=4.'),
            bilan: texte('SJF (Shortest Job First) réduit la moyenne de rotation mais peut affamer les tâches longues.', 'SJF reduces average turnaround but can starve long tasks.'),
            processus: [
                { nom: 'P1', arrivee: 0, duree: 6, echeance: 18 },
                { nom: 'P2', arrivee: 0, duree: 3, echeance: 7 },
                { nom: 'P3', arrivee: 1, duree: 2, echeance: 9 },
                { nom: 'P4', arrivee: 2, duree: 4, echeance: 16 },
            ], moyenneMax: 14,
        },
        {
            id: 'cpu-03', niveau: 3, xp: 200,
            titre: texte('Fenêtre critique', 'Critical window'),
            consigne: texte('Ordonnancer 4 processus simultanés avec des échéances très proches. Moyenne ≤ 12.', 'Schedule 4 simultaneous processes with very close deadlines. Average ≤ 12.'),
            indice: texte('Trier par durée croissante (SJF) puis vérifier les échéances.', 'Sort by increasing duration (SJF) then verify deadlines.'),
            bilan: texte('En pratique, l’ordonnancement temps réel utilise EDF (Earliest Deadline First), pas SJF.', 'Real-time scheduling uses EDF (Earliest Deadline First), not SJF.'),
            processus: [
                { nom: 'P1', arrivee: 0, duree: 5, echeance: 14 },
                { nom: 'P2', arrivee: 0, duree: 2, echeance: 5 },
                { nom: 'P3', arrivee: 0, duree: 1, echeance: 3 },
                { nom: 'P4', arrivee: 0, duree: 3, echeance: 9 },
            ], moyenneMax: 12,
        },
    ],
};
