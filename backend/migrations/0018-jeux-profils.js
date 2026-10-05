/**
 * Profil de joueur des jeux intégrés : le personnage choisi (Kenney Mini Characters, liste dans
 * shared/jeux/avatars.js). Sans ligne, le personnage est tiré du numéro du joueur.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.createTable("JeuxProfils", {
        id_user: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            references: { model: "Users", key: "id_user" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        avatar: { type: DataTypes.STRING(20), allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("JeuxProfils");
};
