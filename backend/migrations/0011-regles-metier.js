/**
 * Phase B — règles métier.
 * - Affectations : date et créneau d'origine d'une séance reportée (l'ancienne heure barrée
 *   s'affiche côté front).
 * - DemandeReports : créneau visé (facultatif ; sinon le créneau de même rang le nouveau jour).
 * - HistoriqueAffectations : action « report » et marqueur de forçage (séance enregistrée
 *   malgré des règles bloquantes, avec la justification en commentaire).
 * - Users : must_change_password, pour les comptes créés par l'administration (invitation).
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");

    await queryInterface.addColumn("Affectations", "date_seance_initiale", { type: DataTypes.DATEONLY, allowNull: true });
    await queryInterface.addColumn("Affectations", "id_creneau_initial", {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Creneaux", key: "id_creneau" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
    });

    await queryInterface.addColumn("DemandeReports", "id_creneau_nouveau", {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "Creneaux", key: "id_creneau" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
    });

    await queryInterface.changeColumn("HistoriqueAffectations", "action", {
        type: DataTypes.ENUM("creation", "modification", "suppression", "annulation", "report"),
        allowNull: false,
    });
    await queryInterface.addColumn("HistoriqueAffectations", "force", { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });

    await queryInterface.addColumn("Users", "must_change_password", { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
};

export const down = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.removeColumn("Users", "must_change_password");
    await queryInterface.removeColumn("HistoriqueAffectations", "force");
    await queryInterface.changeColumn("HistoriqueAffectations", "action", {
        type: DataTypes.ENUM("creation", "modification", "suppression", "annulation"),
        allowNull: false,
    });
    await queryInterface.removeColumn("DemandeReports", "id_creneau_nouveau");
    await queryInterface.removeColumn("Affectations", "id_creneau_initial");
    await queryInterface.removeColumn("Affectations", "date_seance_initiale");
};
