/**
 * Phase D3 — notifications push de l'application mobile (Expo).
 * PushTokens : jeton Expo d'un appareil, rattaché au compte connecté sur cet appareil.
 * Un jeton n'appartient qu'à un compte (changement de compte sur le même téléphone).
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.createTable("PushTokens", {
        id_push_token: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Users", key: "id_user" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        plateforme: { type: DataTypes.ENUM("android", "ios"), allowNull: false, defaultValue: "android" },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("PushTokens", ["id_user"]);
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("PushTokens");
};
