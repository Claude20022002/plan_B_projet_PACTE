/**
 * Tâches périodiques (lot A-7) : avec deux instances de l'API, chacune lance les mêmes minuteries.
 * Un verrou MySQL nommé (GET_LOCK) fait qu'une tâche ne tourne qu'à un endroit à la fois : deux
 * passages simultanés ne font qu'un seul envoi. Chaque passage utile, sauté ou en échec laisse
 * une ligne dans le journal du serveur.
 */

import { QueryTypes } from "sequelize";
import sequelize from "../../config/db.js";

// Un verrou MySQL vaut pour tout le serveur de bases : le nom de la base évite qu'une base de test
// et la production, sur le même serveur, se bloquent l'une l'autre (64 caractères au plus)
const nomDuVerrou = (nom) => `${sequelize.config.database}:${nom}`.slice(0, 64);

/**
 * Lance `tache` si aucune autre instance ne la fait en ce moment.
 * Rend { faite: true, resultat } ; { faite: false } quand le verrou est déjà pris.
 */
export const tacheUnique = (nom, tache) =>
    // Le verrou appartient à une connexion : la transaction garde la même du début à la fin. Elle ne
    // verrouille aucune ligne, la tâche elle-même passe par les autres connexions du pool.
    sequelize.transaction(async (transaction) => {
        const verrou = nomDuVerrou(nom);
        const [{ obtenu }] = await sequelize.query("SELECT GET_LOCK(?, 0) AS obtenu", { replacements: [verrou], type: QueryTypes.SELECT, transaction });
        if (Number(obtenu) !== 1) return { faite: false };
        try {
            return { faite: true, resultat: await tache() };
        } finally {
            await sequelize.query("SELECT RELEASE_LOCK(?)", { replacements: [verrou], type: QueryTypes.SELECT, transaction });
        }
    });

// Une seule tâche périodique à la fois dans ce processus. Chaque passage garde une connexion pour
// son verrou et sa tâche en demande d'autres : les cinq passages lancés ensemble au démarrage
// prenaient les cinq connexions du pool, et plus rien n'avançait pendant 60 s, pas même la
// connexion d'un utilisateur (constaté le 17 octobre 2026). File chaînée : un échec ne l'arrête pas.
let file = Promise.resolve();
const aSonTour = (travail) => {
    const tour = file.then(travail, travail);
    file = tour.catch(() => {});
    return tour;
};

/**
 * Un passage d'une tâche planifiée, sous verrou, sans jamais lever d'erreur, après les passages
 * déjà en file. `bilan(resultat)` rend la ligne du journal, ou rien quand le passage n'a rien
 * fait (une tâche lancée chaque minute ne remplit pas le journal de passages vides).
 * Rend ce que rend `tacheUnique`, ou { faite: false, erreur } en cas d'échec.
 */
export const passage = (nom, tache, bilan = () => null) => aSonTour(() => passageImmediat(nom, tache, bilan));

const passageImmediat = async (nom, tache, bilan) => {
    const debut = Date.now();
    try {
        const issue = await tacheUnique(nom, tache);
        if (!issue.faite) {
            console.log(`--> [${nom}] passage sauté : la tâche tourne déjà sur une autre instance`);
            return issue;
        }
        const ligne = bilan(issue.resultat);
        if (ligne) console.log(`--> [${nom}] ${ligne} (${Date.now() - debut} ms)`);
        return issue;
    } catch (erreur) {
        console.error(`--> [${nom}] échec : ${erreur.message}`);
        return { faite: false, erreur };
    }
};
