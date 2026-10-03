/**
 * Mutualisation entre modules différents (ex. « Gestion de projet » des trois spécialités de
 * 5A, chacune avec son propre module) : chaque groupe garde la composante que sa maquette lui
 * fait suivre. Sans cela, la génération ne voit plus ces groupes couverts et recrée les
 * enseignements absorbés, et la scission ne sait pas vers quel module renvoyer chaque groupe.
 * NULL = le groupe suit la composante de l'enseignement lui-même (cas général).
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");

    await queryInterface.addColumn("EnseignementGroupes", "id_composante_origine", {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "CoursComposantes", key: "id_composante" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
    });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.removeColumn("EnseignementGroupes", "id_composante_origine");
};
