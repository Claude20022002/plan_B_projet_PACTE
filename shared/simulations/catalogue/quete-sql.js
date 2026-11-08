/** Simulation « Requête Parfaite » : remise en ordre des clauses SQL (mécanique sql). */
import { texte, SOURCE } from './_aide.js';

export default {
    code: 'quete-sql', type: 'simulation', discipline: 'bases-de-donnees', moteur: 'sql',
    titre: texte('Requête Parfaite', 'Perfect Query'),
    resume: texte('Remettre dans le bon ordre les clauses d\u2019une requête SQL à partir de fragments mélangés.', 'Reorder shuffled SQL clause fragments into the correct execution order.'),
    objectif: texte('Mémoriser l\u2019ordre canonique SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY sans exécuter de vrai SQL.', 'Learn the canonical clause order without executing any real SQL.'),
    source: null,
    curriculum: { url: SOURCE.gl, titre: texte('Génie Logiciel : Programmation et administration de bases de données', 'Software Engineering: Database programming and administration'), consulteLe: '2026-10-16' },
    defis: [
        {
            id: 'sql-01', niveau: 1, xp: 100,
            titre: texte('Requête simple', 'Simple query'),
            consigne: texte('Attribuer la position (1–4) à chaque fragment pour reformer la requête : SELECT … FROM … WHERE … ORDER BY.', 'Assign a position (1–4) to each fragment to rebuild the query: SELECT … FROM … WHERE … ORDER BY.'),
            indice: texte('La requête commence toujours par SELECT.', 'The query always begins with SELECT.'),
            bilan: texte('L\u2019ordre logique d\u2019exécution SQL n\u2019est pas l\u2019ordre d\u2019écriture : FROM précède WHERE dans le plan d\u2019exécution.', 'SQL logical execution order differs from writing order: FROM precedes WHERE in the execution plan.'),
            clauses: [
                { texte: 'FROM etudiants', position: 2 },
                { texte: 'WHERE note > 10', position: 3 },
                { texte: 'SELECT nom, prenom', position: 1 },
                { texte: 'ORDER BY note DESC', position: 4 },
            ],
        },
        {
            id: 'sql-02', niveau: 2, xp: 150,
            titre: texte('Agrégation par filière', 'Group by programme'),
            consigne: texte('Reconstruire : SELECT … FROM … WHERE … GROUP BY.', 'Rebuild: SELECT … FROM … WHERE … GROUP BY.'),
            indice: texte('GROUP BY vient toujours après WHERE.', 'GROUP BY always comes after WHERE.'),
            bilan: texte('WHERE filtre les lignes avant agrégation ; HAVING filtre après agrégation — deux moments différents.', 'WHERE filters rows before aggregation; HAVING filters after — two different stages.'),
            clauses: [
                { texte: 'GROUP BY filiere', position: 4 },
                { texte: 'SELECT filiere, AVG(note)', position: 1 },
                { texte: 'WHERE annee = 2026', position: 3 },
                { texte: 'FROM notes', position: 2 },
            ],
        },
        {
            id: 'sql-03', niveau: 3, xp: 200,
            titre: texte('Filtrer après agrégat', 'Filter after aggregate'),
            consigne: texte('Reconstruire sans WHERE : SELECT … FROM … GROUP BY … HAVING.', 'Rebuild without WHERE: SELECT … FROM … GROUP BY … HAVING.'),
            indice: texte('HAVING suit toujours GROUP BY immédiatement.', 'HAVING always follows GROUP BY directly.'),
            bilan: texte('Une requête SQL correcte respecte un ordre strict. En exécution réelle, les SGBD peuvent réorganiser les accès ; ici seul l\u2019ordre syntaxique est testé.', 'A correct SQL query obeys a strict order. Real DBMS engines can reorder access; here only syntax order is tested.'),
            clauses: [
                { texte: 'HAVING COUNT(*) > 5', position: 4 },
                { texte: 'SELECT filiere, COUNT(*)', position: 1 },
                { texte: 'FROM etudiants', position: 2 },
                { texte: 'GROUP BY filiere', position: 3 },
            ],
        },
    ],
};
