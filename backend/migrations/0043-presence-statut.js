/**
 * Appel à trois statuts (docs/plans/espace-de-cours.md, lot E-6) : présent, en retard, absent.
 * Absent reste l'absence de ligne ; une présence porte désormais son statut (« present » par
 * défaut : toutes les lignes existantes le sont) et, facultatif, un motif court. modifie_par et
 * modifie_le gardent la trace d'une correction faite à la main, après le scan ou après l'appel.
 * Pas de statut « excusé » (décision du chef de projet, 15 octobre 2026).
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.addColumn("Presences", "statut", { type: DataTypes.STRING(10), allowNull: false, defaultValue: "present" });
    await queryInterface.addColumn("Presences", "motif", { type: DataTypes.STRING(200), allowNull: true });
    await queryInterface.addColumn("Presences", "modifie_par", { type: DataTypes.INTEGER, allowNull: true, references: { model: "Users", key: "id_user" }, onDelete: "SET NULL", onUpdate: "CASCADE" });
    await queryInterface.addColumn("Presences", "modifie_le", { type: DataTypes.DATE, allowNull: true });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.removeColumn("Presences", "modifie_le");
    await queryInterface.removeColumn("Presences", "modifie_par");
    await queryInterface.removeColumn("Presences", "motif");
    await queryInterface.removeColumn("Presences", "statut");
};
