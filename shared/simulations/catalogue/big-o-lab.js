/** Simulation « Big-O Lab » : classer des extraits d'algorithmes par leur complexité asymptotique. */
import { texte, SOURCE } from './_aide.js';

export default {
    code: 'big-o-lab', type: 'simulation', discipline: 'algorithmique', moteur: 'complexite',
    titre: texte('Labo Big-O', 'Big-O Lab'),
    resume: texte('Reconnaître la classe de complexité (O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ)) de vrais motifs de boucles et de récursions.', 'Identify the complexity class (O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ)) of common loop and recursion patterns.'),
    objectif: texte('Relier la structure d’un algorithme à son ordre de grandeur, sans exécuter de code.', 'Connect an algorithm’s structure to its order of growth without running any code.'),
    source: null,
    inspiration: texte('Motifs classiques des cours « Introduction to Algorithms » (MIT 6.006, Stanford CS161) et analyses asymptotiques de CLRS — mécaniques réutilisées, exercices originaux.', 'Classic patterns from introductory algorithms courses (MIT 6.006, Stanford CS161) and CLRS asymptotic analysis — mechanics reused, original exercises.'),
    curriculum: { url: SOURCE.algo, titre: texte('Informatique : Algorithmique et structures de données', 'Computer Science: Algorithms and Data Structures'), consulteLe: '2026-10-16' },
    defis: [
        {
            id: 'complexite-01', niveau: 1, xp: 100,
            titre: texte('Motifs de base', 'Core patterns'),
            consigne: texte('Associer chaque extrait à sa classe : 1 = O(1), 2 = O(log n), 3 = O(n), 4 = O(n log n), 5 = O(n²), 6 = O(2ⁿ).', 'Match each snippet to its class: 1 = O(1), 2 = O(log n), 3 = O(n), 4 = O(n log n), 5 = O(n²), 6 = O(2ⁿ).'),
            indice: texte('Une boucle qui parcourt tous les éléments est linéaire ; deux boucles imbriquées complètes sont quadratiques.', 'A loop over all elements is linear; two full nested loops are quadratic.'),
            bilan: texte('Le nombre d’accès élémentaires détermine l’ordre de grandeur, pas le langage ni les constantes.', 'The number of elementary accesses sets the order of growth, not the language or the constants.'),
            extraits: [
                { id: 'A1', titre: texte('Accès direct', 'Direct access'), code: texte('renvoyer tableau[0] + 1', 'return array[0] + 1'), profil: 'constant' },
                { id: 'A2', titre: texte('Division répétée', 'Repeated halving'), code: texte('tant que n > 1 : n ← n / 2', 'while n > 1: n ← n / 2'), profil: 'logarithmique' },
                { id: 'A3', titre: texte('Parcours simple', 'Single pass'), code: texte('pour i de 0 à n : afficher(i)', 'for i in 0..n: print(i)'), profil: 'lineaire' },
                { id: 'A4', titre: texte('Double boucle', 'Nested loop'), code: texte('pour i de 0 à n : pour j de 0 à n : s ← s + 1', 'for i in 0..n: for j in 0..n: s ← s + 1'), profil: 'quadratique' },
            ],
        },
        {
            id: 'complexite-02', niveau: 2, xp: 150,
            titre: texte('Diviser pour régner', 'Divide and conquer'),
            consigne: texte('Reconnaître recherche dichotomique, tri fusion, somme linéaire et double boucle dépendante.', 'Recognize binary search, merge sort, a linear sum, and a dependent nested loop.'),
            indice: texte('Un tri qui divise en deux puis fusionne en linéaire fait O(n log n).', 'A sort that halves then merges in linear time is O(n log n).'),
            bilan: texte('La récurrence T(n) = 2T(n/2) + O(n) donne O(n log n) : le coût de fusion domine la profondeur.', 'The recurrence T(n) = 2T(n/2) + O(n) yields O(n log n): the merge cost drives the depth.'),
            extraits: [
                { id: 'B1', titre: texte('Recherche dichotomique', 'Binary search'), code: texte('à chaque pas, écarter la moitié du tableau trié', 'at each step, discard half of the sorted array'), profil: 'logarithmique' },
                { id: 'B2', titre: texte('Tri fusion', 'Merge sort'), code: texte('diviser le tableau en deux, trier, puis fusionner en O(n)', 'split in half, sort, then merge in O(n)'), profil: 'lineaire_log' },
                { id: 'B3', titre: texte('Somme d’une liste', 'Sum a list'), code: texte('total ← 0 ; pour x dans liste : total ← total + x', 'total ← 0; for x in list: total ← total + x'), profil: 'lineaire' },
                { id: 'B4', titre: texte('Boucle dépendante', 'Dependent loop'), code: texte('pour i de 0 à n : pour j de i à n : s ← s + 1', 'for i in 0..n: for j in i..n: s ← s + 1'), profil: 'quadratique' },
            ],
        },
        {
            id: 'complexite-03', niveau: 3, xp: 200,
            titre: texte('Récursion et pièges', 'Recursion and traps'),
            consigne: texte('Distinguer Fibonacci naïf, remplissage d’une matrice n×n, formule fermée et diviser-par-deux.', 'Tell apart naive Fibonacci, filling an n×n matrix, a closed formula, and halving.'),
            indice: texte('Deux appels récursifs par niveau sans mémisation doublent le travail à chaque étage.', 'Two recursive calls per level without memoization double the work at each floor.'),
            bilan: texte('n*(n+1)/2 est O(1) alors que le même résultat par addition itérée est O(n) : la formulation compte.', 'n*(n+1)/2 is O(1) while the same result by iterated addition is O(n): the formulation matters.'),
            extraits: [
                { id: 'C1', titre: texte('Fibonacci naïf', 'Naive Fibonacci'), code: texte('fib(n) = fib(n-1) + fib(n-2)', 'fib(n) = fib(n-1) + fib(n-2)'), profil: 'exponentiel' },
                { id: 'C2', titre: texte('Matrice complète', 'Full matrix'), code: texte('pour i de 0 à n : pour j de 0 à n : m[i][j] ← 0', 'for i in 0..n: for j in 0..n: m[i][j] ← 0'), profil: 'quadratique' },
                { id: 'C3', titre: texte('Formule fermée', 'Closed formula'), code: texte('renvoyer n * (n + 1) / 2', 'return n * (n + 1) / 2'), profil: 'constant' },
                { id: 'C4', titre: texte('Réduction géométrique', 'Geometric shrink'), code: texte('tant que n > 1 : n ← n / 2', 'while n > 1: n ← n / 2'), profil: 'logarithmique' },
            ],
        },
    ],
};
