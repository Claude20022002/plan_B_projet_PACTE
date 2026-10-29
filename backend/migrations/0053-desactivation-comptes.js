/**
 * Désactivation des comptes par l'administration (plan multi-établissements, fichier 11, lot ME-17) :
 *  - Users.desactivation_prevue_le, desactivation_motif, desactivation_preavis, preavis_envoye_le :
 *    une désactivation programmée (fin de contrat, départ), son motif, et le courriel de préavis
 *    envoyé 5 jours avant (décision du 24 octobre, Q-14) ;
 *  - Users.anonymise_le : date à laquelle l'identité du compte a été effacée (loi 09-08) ;
 *  - Desactivations : l'historique de chaque désactivation, réactivation, programmation et
 *    anonymisation, avec son motif et son auteur (un compte désactivé n'est jamais supprimé).
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.addColumn("Users", "desactivation_prevue_le", { type: DataTypes.DATEONLY, allowNull: true });
    await queryInterface.addColumn("Users", "desactivation_motif", { type: DataTypes.STRING(20), allowNull: true });
    await queryInterface.addColumn("Users", "desactivation_preavis", { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true });
    await queryInterface.addColumn("Users", "preavis_envoye_le", { type: DataTypes.DATE, allowNull: true });
    await queryInterface.addColumn("Users", "anonymise_le", { type: DataTypes.DATE, allowNull: true });
    await queryInterface.createTable("Desactivations", {
        id_desactivation: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: { type: DataTypes.INTEGER, allowNull: false, references: { model: "Users", key: "id_user" }, onDelete: "CASCADE", onUpdate: "CASCADE" },
        action: { type: DataTypes.STRING(20), allowNull: false },
        motif: { type: DataTypes.STRING(20), allowNull: true },
        effet_le: { type: DataTypes.DATEONLY, allowNull: true },
        id_auteur: { type: DataTypes.INTEGER, allowNull: true, references: { model: "Users", key: "id_user" }, onDelete: "SET NULL", onUpdate: "CASCADE" },
        details: { type: DataTypes.JSON, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("Desactivations", ["id_user", "createdAt"]);
    await queryInterface.addIndex("Users", ["desactivation_prevue_le"], { name: "users_desactivation_prevue" });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.removeIndex("Users", "users_desactivation_prevue");
    await queryInterface.dropTable("Desactivations");
    for (const colonne of ["anonymise_le", "preavis_envoye_le", "desactivation_preavis", "desactivation_motif", "desactivation_prevue_le"]) {
        await queryInterface.removeColumn("Users", colonne);
    }
};
