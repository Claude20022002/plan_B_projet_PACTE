/**
 * Index (optimisation, étape 2), mesurés sur le banc (tests/banc) :
 *  - Statistiques : index couvrant sur la période. Les statistiques lisent l'année en cours ;
 *    sans lui, MySQL parcourt toute la table, historique compris (avec cinq années : 61 à 144 ms
 *    par route, contre 27 à 53 ms avec l'index, comme pour une seule année). Il contient toutes
 *    les colonnes lues : la table elle-même n'est plus touchée.
 *  - Emploi du temps de l'étudiant : séances mutualisées par enseignement et date (568 lignes
 *    lues pour un mois, une trentaine avec l'index).
 *  - Notifications d'un utilisateur, les plus récentes d'abord.
 *  - Index à une colonne devenus redondants (préfixes d'un index composite, qui sert aussi la
 *    clé étrangère) : supprimés, chaque écriture de séance en maintient cinq de moins.
 *
 * Les index redondants sont repérés par leurs colonnes, pas par leur nom (il dépend de l'histoire
 * de la base). MySQL supprime de lui-même l'index implicite d'une clé étrangère quand un nouvel
 * index peut la servir : on ne retire que ce qui existe encore.
 */
const AJOUTS = [
    { table: "Affectations", champs: ["date_seance", "statut", "id_creneau", "id_salle", "id_groupe", "id_user_enseignant", "id_cours"], nom: "affectations_statistiques" },
    { table: "Affectations", champs: ["id_enseignement", "date_seance"], nom: "affectations_enseignement_date" },
    { table: "Notifications", champs: ["id_user", "date_envoi"], nom: "notifications_user_date" },
];

// Colonnes dont l'index simple (non unique) est redondant une fois les composites en place
const REDONDANTS = [
    { table: "Affectations", colonne: "id_groupe" }, // affectations_groupe_date (0028)
    { table: "Affectations", colonne: "id_salle" }, // affectations_salle_date (0028)
    { table: "Affectations", colonne: "id_user_enseignant" }, // affectations_enseignant_date (0028)
    { table: "Affectations", colonne: "id_enseignement" }, // affectations_enseignement_date
    { table: "Notifications", colonne: "id_user" }, // notifications_user_date
    { table: "AuthSessions", colonne: "refresh_token_hash" }, // doublon de l'index unique
];

const indexSimples = async (queryInterface, table, colonne) =>
    (await queryInterface.showIndex(table))
        .filter((i) => !i.primary && !i.unique && i.fields.length === 1 && i.fields[0].attribute === colonne)
        .map((i) => i.name);

export const up = async ({ queryInterface }) => {
    for (const { table, champs, nom } of AJOUTS) {
        await queryInterface.addIndex(table, champs, { name: nom });
    }
    for (const { table, colonne } of REDONDANTS) {
        for (const nom of await indexSimples(queryInterface, table, colonne)) {
            await queryInterface.removeIndex(table, nom);
        }
    }
};

export const down = async ({ queryInterface }) => {
    // Index simples d'abord : les clés étrangères doivent garder un index quand les composites partent
    for (const { table, colonne } of REDONDANTS) {
        if (!(await indexSimples(queryInterface, table, colonne)).length) {
            await queryInterface.addIndex(table, [colonne], { name: `${table.toLowerCase()}_${colonne}` });
        }
    }
    for (const { table, nom } of AJOUTS) {
        await queryInterface.removeIndex(table, nom);
    }
};
