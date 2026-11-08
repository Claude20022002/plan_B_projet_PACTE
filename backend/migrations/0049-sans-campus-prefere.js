/**
 * Plus de campus préféré pour une filière ni pour un groupe (décision du 21 octobre 2026) : toute
 * filière peut avoir cours dans n'importe quel bâtiment ; les salles se répartissent selon
 * l'effectif, la capacité et la disponibilité. Les colonnes ajoutées par 0006 (Filiere) et 0040
 * (Groupes) disparaissent, avec leur clé étrangère. Le campus préféré d'un enseignant reste.
 * Retour arrière : les colonnes reviennent vides.
 */
const COLONNES = [
    ["Filiere", "id_campus_prefere"],
    ["Groupes", "id_campus_prefere"],
];

/** Noms des clés étrangères posées sur une colonne (MySQL refuse de supprimer une colonne qui en a). */
const clesEtrangeres = async (sequelize, table, colonne) => {
    const [lignes] = await sequelize.query(
        `SELECT CONSTRAINT_NAME AS nom FROM information_schema.KEY_COLUMN_USAGE
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
        { replacements: [table, colonne] }
    );
    return lignes.map((l) => l.nom);
};

export const up = async ({ queryInterface }) => {
    for (const [table, colonne] of COLONNES) {
        const description = await queryInterface.describeTable(table);
        if (!description[colonne]) continue;
        for (const nom of await clesEtrangeres(queryInterface.sequelize, table, colonne)) {
            await queryInterface.removeConstraint(table, nom);
        }
        await queryInterface.removeColumn(table, colonne);
    }
};

export const down = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    for (const [table, colonne] of COLONNES) {
        await queryInterface.addColumn(table, colonne, {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Campus", key: "id_campus" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
        });
    }
};
