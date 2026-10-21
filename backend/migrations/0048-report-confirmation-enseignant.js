/**
 * Report confirmé par l'enseignant (décision du 21 octobre 2026) : le système propose, l'administration
 * valide (statut « a_confirmer »), puis l'enseignant accepte ou propose un autre créneau que le serveur
 * vérifie. La séance ne bouge qu'à ce moment. Un forçage décidé par l'administration est gardé avec
 * sa justification et son auteur, pour être appliqué à la confirmation.
 */
const STATUTS = ["en_attente", "a_confirmer", "approuve", "refuse"];
const ANCIENS = ["en_attente", "approuve", "refuse"];

export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.changeColumn("DemandeReports", "statut_demande", { type: DataTypes.ENUM(...STATUTS), defaultValue: "en_attente" });
    await queryInterface.addColumn("DemandeReports", "id_user_decision", { type: DataTypes.INTEGER, allowNull: true, references: { model: "Users", key: "id_user" }, onDelete: "SET NULL", onUpdate: "CASCADE" });
    await queryInterface.addColumn("DemandeReports", "justification_forcage", { type: DataTypes.TEXT, allowNull: true });
};

export const down = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.removeColumn("DemandeReports", "justification_forcage");
    await queryInterface.removeColumn("DemandeReports", "id_user_decision");
    // Une demande encore à confirmer redevient en attente : l'administration la retraitera
    await queryInterface.sequelize.query("UPDATE DemandeReports SET statut_demande = 'en_attente' WHERE statut_demande = 'a_confirmer'");
    await queryInterface.changeColumn("DemandeReports", "statut_demande", { type: DataTypes.ENUM(...ANCIENS), defaultValue: "en_attente" });
};
