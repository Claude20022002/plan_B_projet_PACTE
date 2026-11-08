/** Simulation « Labo des seuils » : réglage d'un seuil de détection (mécanique seuil). */
import { texte, SOURCE } from './_aide.js';

export default {
    code: 'threshold-lab', type: 'simulation', discipline: 'intelligence-artificielle', moteur: 'seuil',
    titre: texte('Labo des seuils', 'Threshold Lab'),
    resume: texte('Régler un seuil de détection et comparer les faux positifs, les défauts manqués et le coût des erreurs.', 'Tune a detection threshold and compare false positives, missed defects, and error costs.'),
    objectif: texte('Interpréter précision, rappel et matrice de confusion sans confondre score et certitude.', 'Interpret precision, recall, and a confusion matrix without treating a score as certainty.'),
    source: null,
    curriculum: { url: SOURCE.ia, titre: texte('IA & Big Data : Machine Learning', 'AI & Big Data: Machine Learning'), consulteLe: '2026-10-16' },
    defis: [
        {
            id: 'seuil-01', niveau: 1, xp: 100,
            titre: texte('Séparer les pièces', 'Separate the parts'),
            consigne: texte('Détecter tous les défauts sans fausse alerte. Une pièce est signalée si son score est supérieur ou égal au seuil.', 'Detect every defect without false alarms. A part is flagged when its score is greater than or equal to the threshold.'),
            indice: texte('Comparer le score du défaut le plus faible à celui de la pièce conforme la plus élevée.', 'Compare the lowest defect score with the highest score of a conforming part.'),
            bilan: texte('Une séparation parfaite sur ce petit jeu fictif ne prouve pas que le modèle généralise.', 'Perfect separation on this small fictional dataset does not prove that the model generalizes.'),
            observations: [[90, 1], [80, 1], [65, 1], [40, 0], [20, 0], [10, 0]], rappelMin: 100, precisionMin: 100, coutFN: 1, coutFP: 1, coutMax: 0,
        },
        {
            id: 'seuil-02', niveau: 2, xp: 150,
            titre: texte('Ne manquer aucun défaut', 'Miss no defects'),
            consigne: texte('Obtenir un rappel de 100 % et une précision d’au moins 75 %, avec au plus une fausse alerte.', 'Achieve 100% recall and at least 75% precision, with at most one false alarm.'),
            indice: texte('Un défaut a un score de 45. Baisser le seuil récupère ce défaut mais peut ajouter une fausse alerte.', 'One defect has a score of 45. Lowering the threshold recovers it but may add a false alarm.'),
            bilan: texte('Le rappel mesure la part des vrais défauts détectés ; la précision, la part des alertes réellement justifiées.', 'Recall measures how many actual defects are detected; precision measures how many alerts are justified.'),
            observations: [[95, 1], [80, 1], [60, 0], [45, 1], [30, 0], [10, 0]], rappelMin: 100, precisionMin: 75, coutFN: 1, coutFP: 1, coutMax: 1,
        },
        {
            id: 'seuil-03', niveau: 3, xp: 200,
            titre: texte('Le coût d’une erreur', 'The cost of an error'),
            consigne: texte('Atteindre 100 % de rappel, au moins 60 % de précision et un coût maximal de 4 unités. Un défaut manqué coûte 8, une fausse alerte coûte 2.', 'Reach 100% recall, at least 60% precision, and at most 4 cost units. A missed defect costs 8; a false alarm costs 2.'),
            indice: texte('Le défaut à 35 oblige à accepter certaines fausses alertes. Comparer leur coût à celui d’un défaut manqué.', 'The defect at 35 requires accepting some false alarms. Compare their cost with the cost of a missed defect.'),
            bilan: texte('Le seuil dépend du coût métier des erreurs. Il se choisit sur validation, avant une évaluation sur un jeu de test indépendant.', 'The threshold depends on business error costs. Choose it on validation data before evaluating on an independent test set.'),
            observations: [[92, 1], [72, 0], [65, 1], [55, 0], [35, 1], [15, 0]], rappelMin: 100, precisionMin: 60, coutFN: 8, coutFP: 2, coutMax: 4,
        },
    ],
};
