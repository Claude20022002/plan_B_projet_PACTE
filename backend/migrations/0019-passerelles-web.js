/**
 * Passerelle de l'application mobile vers les sites web de la plateforme : un code à usage
 * unique (60 s) que le navigateur du téléphone échange contre une session web (Planner, puis
 * StudyLib et ClassQuiz par la connexion unique). Seule l'empreinte SHA-256 du code est gardée.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.createTable("PasserellesWeb", {
        id_passerelle: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code_hash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Users", key: "id_user" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        suite: { type: DataTypes.STRING(300), allowNull: false },
        expire_le: { type: DataTypes.DATE, allowNull: false },
        utilise_le: { type: DataTypes.DATE, allowNull: true },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("PasserellesWeb", ["expire_le"]);
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("PasserellesWeb");
};
