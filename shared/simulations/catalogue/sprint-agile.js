/** Simulation « Sprint Agile » : sélection de backlog sous capacité/dépendances (mécanique sprint). */
import { texte, SOURCE } from './_aide.js';

export default {
    code: 'sprint-agile', type: 'simulation', discipline: 'gestion-de-projet', moteur: 'sprint',
    titre: texte('Sprint Agile', 'Agile Sprint'),
    resume: texte('Sélectionner des éléments du backlog en respectant capacité, dépendances, obligations et valeur minimale.', 'Select backlog items respecting capacity, dependencies, mandatory flags, and minimum value.'),
    objectif: texte('Planifier un sprint réaliste en arbitrant charge, valeur et contraintes inter-items.', 'Plan a realistic sprint by balancing load, value, and cross-item constraints.'),
    source: null,
    curriculum: { url: SOURCE.mgt, titre: texte('Management de Projet : Agilité et Scrum', 'Project Management: Agility and Scrum'), consulteLe: '2026-10-16' },
    defis: [
        {
            id: 'sprint-01', niveau: 1, xp: 100,
            titre: texte('Première sélection', 'First selection'),
            consigne: texte('Choisir parmi 5 items (1=prix, 0=rejeté). Capacité 13 charges, valeur min 20, items obligatoires inclus.', 'Choose among 5 items (1=pick, 0=skip). Capacity 13 story points, min value 20, mandatory items included.'),
            indice: texte('L’item « Connexion » est obligatoire et vaut 8 pour 5 charges.', 'The "Login" item is mandatory and gives 8 value for 5 points.'),
            bilan: texte('En Scrum, la capacité est un engagement d’équipe, pas une contrainte imposée par le management.', 'In Scrum, capacity is a team commitment, not a top-down constraint.'),
            backlog: [
                { nom: 'Connexion', charges: 5, valeur: 8, obligatoire: true, dependsOn: null },
                { nom: 'Dashboard', charges: 3, valeur: 5, obligatoire: false, dependsOn: null },
                { nom: 'Export PDF', charges: 5, valeur: 7, obligatoire: false, dependsOn: null },
                { nom: 'Notifications', charges: 4, valeur: 6, obligatoire: false, dependsOn: 0 },
                { nom: 'Rapport annuel', charges: 8, valeur: 12, obligatoire: false, dependsOn: null },
            ], capacite: 13, valeurMin: 20,
        },
        {
            id: 'sprint-02', niveau: 2, xp: 150,
            titre: texte('Dépendances obligées', 'Forced dependencies'),
            consigne: texte('Sélectionner en respectant les dépendances : un item ne peut être pris que si son parent l’est aussi. Capacité 12, valeur min 18.', 'Select respecting dependencies: an item can only be taken if its parent is also taken. Capacity 12, min value 18.'),
            indice: texte('Si « Paiement » dépend de « Panier », il faut prendre les deux ou aucun.', 'If "Payment" depends on "Cart", you must take both or neither.'),
            bilan: texte('Les dépendances réduisent l’espace de choix ; un bon/refactor en amout débloque plusieurs items.', 'Dependencies reduce the solution space; an upstream refactor can unblock several items.'),
            backlog: [
                { nom: 'Panier', charges: 4, valeur: 6, obligatoire: true, dependsOn: null },
                { nom: 'Paiement', charges: 5, valeur: 8, obligatoire: false, dependsOn: 0 },
                { nom: 'Recherche', charges: 3, valeur: 5, obligatoire: false, dependsOn: null },
                { nom: 'Wishlist', charges: 4, valeur: 6, obligatoire: false, dependsOn: 0 },
                { nom: 'Coupon', charges: 2, valeur: 3, obligatoire: false, dependsOn: 1 },
            ], capacite: 12, valeurMin: 18,
        },
        {
            id: 'sprint-03', niveau: 3, xp: 200,
            titre: texte('Tension extrême', 'Extreme tension'),
            consigne: texte('Capacité 10, valeur min 16, deux items obligatoires, trois dépendances. Trouver une combinaison viable.', 'Capacity 10, min value 16, two mandatory items, three dependencies. Find a viable combination.'),
            indice: texte('Commencer par les obligatoires, soustraire de la capacité, puis vérifier les dépendances restantes.', 'Start with mandatory items, subtract from capacity, then check remaining dependencies.'),
            bilan: texte('Un sprint bien planifié accepte moins de work-in-progress plutôt que de surengager l’équipe.', 'A well-planned sprint accepts less WIP rather than over-committing the team.'),
            backlog: [
                { nom: 'Auth', charges: 3, valeur: 5, obligatoire: true, dependsOn: null },
                { nom: 'API Gateway', charges: 4, valeur: 7, obligatoire: true, dependsOn: null },
                { nom: 'Monitoring', charges: 3, valeur: 4, obligatoire: false, dependsOn: 1 },
                { nom: 'CI/CD', charges: 4, valeur: 6, obligatoire: false, dependsOn: 0 },
                { nom: 'Alerting', charges: 2, valeur: 3, obligatoire: false, dependsOn: 2 },
            ], capacite: 10, valeurMin: 16,
        },
    ],
};
