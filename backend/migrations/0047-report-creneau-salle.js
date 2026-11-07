/**
 * Report de séance (recette du 20 octobre 2026, B-2 et M-5) : l'enseignant ne choisit que la date ;
 * le serveur retient un créneau et une salle libres, gardés avec la demande, et l'administration
 * peut approuver avec un autre créneau ou une autre salle. Le refus garde sa raison, que
 * l'enseignant lit dans la notification et dans sa liste.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.addColumn("DemandeReports", "id_salle_nouvelle", { type: DataTypes.INTEGER, allowNull: true, references: { model: "Salles", key: "id_salle" }, onDelete: "SET NULL", onUpdate: "CASCADE" });
    await queryInterface.addColumn("DemandeReports", "motif_decision", { type: DataTypes.TEXT, allowNull: true });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.removeColumn("DemandeReports", "motif_decision");
    await queryInterface.removeColumn("DemandeReports", "id_salle_nouvelle");
};
