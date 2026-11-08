/** Simulation « Pilote des stocks » : réapprovisionnement sous capacité et budget (mécanique stock). */
import { texte, SOURCE } from './_aide.js';

export default {
    code: 'stock-pilot', type: 'simulation', discipline: 'logistique', moteur: 'stock',
    titre: texte('Pilote des stocks', 'Stock Pilot'),
    resume: texte('Planifier trois jours de réapprovisionnement sans rupture, en respectant capacité et budget en MAD.', 'Plan three days of replenishment without stockouts, respecting capacity and a MAD budget.'),
    objectif: texte('Anticiper la demande et les délais, puis arbitrer stock, capacité et coût.', 'Anticipate demand and lead times, then balance inventory, capacity, and cost.'),
    source: null,
    curriculum: { url: SOURCE.stock, titre: texte('Logistique & Transport : stocks et approvisionnements', 'Logistics & Transport: inventory and procurement'), consulteLe: '2026-10-16' },
    defis: [
        {
            id: 'stock-01', niveau: 1, xp: 100,
            titre: texte('Juste ce qu’il faut', 'Just enough'),
            consigne: texte('Servir toute la demande en trois jours, sans dépasser 10 unités en stock ni 100 MAD d’achats. Les commandes arrivent le jour même, avant la demande.', 'Serve all demand over three days without exceeding 10 units in stock or 100 MAD in purchases. Orders arrive the same day, before demand.'),
            indice: texte('Le stock initial couvre le premier jour. Commander ensuite les quantités manquantes.', 'Initial stock covers the first day. Then order the missing quantities.'),
            bilan: texte('Le stock de fin de journée devient celui du lendemain. Acheter trop tôt peut dépasser la capacité.', 'Closing stock becomes the next day’s opening stock. Buying too early can exceed capacity.'),
            demandes: [4, 6, 3], initial: 5, capacite: 10, delai: 0, prix: 10, budget: 100, finalMax: 2,
        },
        {
            id: 'stock-02', niveau: 2, xp: 150,
            titre: texte('Une journée de délai', 'One-day lead time'),
            consigne: texte('Servir la demande avec un délai d’un jour, une capacité de 12, un budget de 120 MAD et au plus 2 unités finales. Aucune livraison déjà en route.', 'Serve demand with a one-day lead time, capacity 12, budget 120 MAD, and at most 2 units left. No deliveries are already in transit.'),
            indice: texte('La commande du jour 1 arrive au début du jour 2. La commande du dernier jour arrive après la période et coûte quand même.', 'Day 1’s order arrives at the start of day 2. The last day’s order arrives after the horizon but still costs money.'),
            bilan: texte('Un délai exige d’anticiper : une commande ne peut pas réparer une rupture survenue avant son arrivée.', 'Lead times require anticipation: an order cannot repair a stockout that occurs before it arrives.'),
            demandes: [5, 7, 4], initial: 7, capacite: 12, delai: 1, prix: 10, budget: 120, finalMax: 2,
        },
        {
            id: 'stock-03', niveau: 3, xp: 200,
            titre: texte('Budget serré', 'Tight budget'),
            consigne: texte('Servir la demande avec un délai d’un jour, une capacité de 10, un budget de 108 MAD et aucun stock final. Les commandes encore en transit sont interdites en fin de période.', 'Serve demand with a one-day lead time, capacity 10, budget 108 MAD, and no closing stock. No orders may remain in transit at the end.'),
            indice: texte('Après le premier jour il reste 2 unités. Calculer le complément nécessaire pour les jours 2 et 3.', 'After day 1, 2 units remain. Calculate the shortfall for days 2 and 3.'),
            bilan: texte('Le plan doit respecter simultanément service, trésorerie et capacité. Le modèle simplifié ignore les coûts de stockage et la demande incertaine.', 'The plan must satisfy service, cash, and capacity constraints together. This simplified model ignores holding costs and uncertain demand.'),
            demandes: [4, 8, 3], initial: 6, capacite: 10, delai: 1, prix: 12, budget: 108, finalMax: 0,
        },
    ],
};
