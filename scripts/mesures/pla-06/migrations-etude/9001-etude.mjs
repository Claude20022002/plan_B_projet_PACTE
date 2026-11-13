/**
 * Migration d'étude PLA-06 (M5b, C-7) : une migration « étendre » typique, appliquée aux 200 bases
 * pour en mesurer la durée. Elle vit hors de backend/migrations et n'est jamais livrée : une colonne
 * et un index sur Affectations (la plus grosse table), et une table nouvelle. `down` défait tout.
 */
export async function up({ context: { queryInterface, Sequelize } }) {
    await queryInterface.addColumn("Affectations", "etude_pla06", { type: Sequelize.STRING(40), allowNull: true });
    await queryInterface.addIndex("Affectations", ["etude_pla06"], { name: "idx_affectations_etude_pla06" });
    await queryInterface.createTable("EtudePla06", {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        libelle: { type: Sequelize.STRING(80), allowNull: false },
        createdAt: { type: Sequelize.DATE, allowNull: false },
        updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
}

export async function down({ context: { queryInterface } }) {
    await queryInterface.dropTable("EtudePla06");
    await queryInterface.removeIndex("Affectations", "idx_affectations_etude_pla06");
    await queryInterface.removeColumn("Affectations", "etude_pla06");
}
