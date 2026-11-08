/** Simulation « Nœuds Réseaux » : placement d'équipements sur des switchs (mécanique reseau). */
import { texte, SOURCE } from './_aide.js';

export default {
    code: 'topo-reseau', type: 'simulation', discipline: 'reseaux', moteur: 'reseau',
    titre: texte('Nœuds Réseaux', 'Network Nodes'),
    resume: texte('Connecter 4 équipements sur 3 switchs en respectant capacité, segmentation et isolation.', 'Connect 4 devices to 3 switches while respecting capacity, subnet, and isolation constraints.'),
    objectif: texte('Concevoir une topologie simple conforme aux exigences de sécurité et de bande passante.', 'Design a simple topology meeting security and bandwidth requirements.'),
    source: null,
    curriculum: { url: SOURCE.cyber, titre: texte('Génie Informatique : Systèmes, Réseaux et Cybersécurité', 'Computer Engineering: Systems, Networks and Cybersecurity'), consulteLe: '2026-10-16' },
    defis: [
        {
            id: 'reseau-01', niveau: 1, xp: 100,
            titre: texte('Première topologie', 'First topology'),
            consigne: texte('Placer les 4 équipements sur les switchs S1 (cap. 2), S2 (cap. 2) ou S3 (cap. 2). Aucune autre contrainte.', 'Place the 4 devices on S1 (cap 2), S2 (cap 2) or S3 (cap 2). No other constraints.'),
            indice: texte('Répartir également : deux équipements maximum par switch.', 'Spread evenly: at most two devices per switch.'),
            bilan: texte('Un switch peut regrouper des appareils ; la capacité dépend du plan d\u2019adressage et du trafic attendu.', 'A switch can group devices; capacity depends on addressing plan and expected traffic.'),
            switches: [{ nom: 'S1', capacite: 2 }, { nom: 'S2', capacite: 2 }, { nom: 'S3', capacite: 2 }],
            appareils: [{ nom: 'Poste Admin' }, { nom: 'Serveur Web' }, { nom: 'Switch Core' }, { nom: 'AP WiFi' }],
            contraintes_same: [], contraintes_diff: [],
        },
        {
            id: 'reseau-02', niveau: 2, xp: 150,
            titre: texte('Même sous-réseau, isolation', 'Same subnet, isolation'),
            consigne: texte('Poste Admin et Serveur Web doivent être sur le même switch (même VLAN). Serveur Web et AP WiFi doivent être sur des switchs différents. S3 accepte jusqu\u2019à 3 appareils.', 'Admin and Web Server must be on the same switch (same VLAN). Web Server and AP WiFi must be on different switches. S3 accepts up to 3 devices.'),
            indice: texte('Mettre Admin et Web Server ensemble sur S1 (port 0), le reste ailleurs.', 'Put Admin and Web Server together on S1 (port 0), the rest elsewhere.'),
            bilan: texte('La segmentation VLAN isole le trafic sensible sans nécessiter des machines séparées.', 'VLAN segmentation isolates sensitive traffic without requiring separate physical machines.'),
            switches: [{ nom: 'S1', capacite: 2 }, { nom: 'S2', capacite: 2 }, { nom: 'S3', capacite: 3 }],
            appareils: [{ nom: 'Poste Admin' }, { nom: 'Serveur Web' }, { nom: 'Switch Core' }, { nom: 'AP WiFi' }],
            contraintes_same: [[0, 1]], contraintes_diff: [[1, 3]],
        },
        {
            id: 'reseau-03', niveau: 3, xp: 200,
            titre: texte('Zéro confiance', 'Zero trust'),
            consigne: texte('Poste Admin et Switch Core ne doivent pas être sur le même switch. Serveur Web et AP WiFi doivent être ensemble (DMZ). S1 n’accepte qu’un seul appareil.', 'Admin and Core Switch must be on different switches. Web Server and AP WiFi must be together (DMZ). S1 accepts only one device.'),
            indice: texte('Core sur S1 (1 seul, ok), Web+WiFi sur S2 (2 ≤ 3 ok), Admin sur S3.', 'Core on S1 (only 1, ok), Web+WiFi on S2 (2 ≤ 3 ok), Admin on S3.'),
            bilan: texte('Une topologie réseau est un compromis entre coût matériel, segmentation de sécurité et simplicité administrative.', 'A network topology balances hardware cost, security segmentation, and administrative simplicity.'),
            switches: [{ nom: 'S1', capacite: 1 }, { nom: 'S2', capacite: 3 }, { nom: 'S3', capacite: 2 }],
            appareils: [{ nom: 'Poste Admin' }, { nom: 'Serveur Web' }, { nom: 'Switch Core' }, { nom: 'AP WiFi' }],
            contraintes_same: [[1, 3]], contraintes_diff: [[0, 2]],
        },
    ],
};
