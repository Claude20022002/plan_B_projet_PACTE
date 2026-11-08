/** Simulation « Budget ERP » : allocation de quantités sous budget/coût unitaire (mécanique budget). */
import { texte, SOURCE } from './_aide.js';

export default {
    code: 'budget-erp', type: 'simulation', discipline: 'gestion', moteur: 'budget',
    titre: texte('Budget ERP', 'ERP Budget'),
    resume: texte('Allouer des quantités sur 4 postes de coût pour rester dans le budget tout en couvrant un minimum et un coût unitaire.', 'Allocate quantities across 4 cost lines to stay within budget while meeting coverage and unit-cost targets.'),
    objectif: texte('Appliquer un modèle de coût linéaire (fixe + unité × qté) et arbitrer couverture vs. dépense.', 'Apply a linear cost model (fixed + unit × qty) and balance coverage versus spending.'),
    source: null,
    curriculum: { url: SOURCE.fin, titre: texte('Gestion : Contrôle de coûts et ERP', 'Business: Cost Control and ERP'), consulteLe: '2026-10-16' },
    defis: [
        {
            id: 'budget-01', niveau: 1, xp: 100,
            titre: texte('Premier plan', 'First plan'),
            consigne: texte('Allouer des quantités (0-999) sur 4 postes. Budget 200 MAD, couverture min 2, coût unitaire max 70.', 'Allocate quantities (0-999) across 4 lines. Budget 200 MAD, min coverage 2, max unit cost 70.'),
            indice: texte('Chaque poste = fixe + unité × qté. Viser la couverture minimale avant le budget.', 'Each line = fixed + unit × qty. Aim for minimum coverage before the budget cap.'),
            bilan: texte('Un modèle de coût linéaire ignore les remises quantitatives et les paliers ; c’est une simplification.', 'A linear cost model ignores volume discounts and tiers; it is a simplification.'),
            lignes: [
                { nom: 'Licence', fixe: 20, unite: 10 },
                { nom: 'Formation', fixe: 15, unite: 5 },
                { nom: 'Support', fixe: 10, unite: 8 },
                { nom: 'Hébergement', fixe: 25, unite: 3 },
            ], budget: 200, couvertureMin: 2, couteUnitaireMax: 70,
        },
        {
            id: 'budget-02', niveau: 2, xp: 150,
            titre: texte('Budget serré', 'Tight budget'),
            consigne: texte('Budget 150 MAD, couverture min 3, coût unitaire max 50. Chaque poste doit avoir ≥ 3 unités.', 'Budget 150 MAD, min coverage 3, max unit cost 50. Every line must have ≥ 3 units.'),
            indice: texte('Les coûts fixes consomment déjà 45 MAD. Vérifier si [3,3,3,3] passe les trois contraintes.', 'Fixed costs already consume 45 MAD. Check whether [3,3,3,3] passes all three constraints.'),
            bilan: texte('Le compromis entre couverture et budget force à optimiser les quantités, pas seulement les réduire.', 'The coverage-budget trade-off forces quantity optimisation, not just reduction.'),
            lignes: [
                { nom: 'Licence', fixe: 15, unite: 12 },
                { nom: 'Formation', fixe: 10, unite: 4 },
                { nom: 'Support', fixe: 8, unite: 6 },
                { nom: 'Infrastructure', fixe: 12, unite: 9 },
            ], budget: 150, couvertureMin: 3, couteUnitaireMax: 50,
        },
        {
            id: 'budget-03', niveau: 3, xp: 200,
            titre: texte('Couverture maximale', 'Maximum coverage'),
            consigne: texte('Budget 165 MAD, couverture min 4, coût unitaire max 45. Trouver la répartition viable.', 'Budget 165 MAD, min coverage 4, max unit cost 45. Find the viable allocation.'),
            indice: texte('Avec 4 unités partout, total = somme(fixés) + 4×somme(unités). Vérifier sous 165.', 'With 4 units everywhere, total = sum(fixed) + 4×sum(units). Verify it stays under 165.'),
            bilan: texte('En ERP réel (SAP, Odoo), les centres de coût intègrent amortissement, overhead et répartition — ici le modèle est linéaire.', 'Real ERP cost centres include depreciation, overhead, and allocation — here the model is linear.'),
            lignes: [
                { nom: 'Logiciel', fixe: 15, unite: 8 },
                { nom: 'Matériel', fixe: 20, unite: 6 },
                { nom: 'Main-d’œuvre', fixe: 10, unite: 10 },
                { nom: 'Formation', fixe: 5, unite: 4 },
            ], budget: 165, couvertureMin: 4, couteUnitaireMax: 45,
        },
    ],
};
