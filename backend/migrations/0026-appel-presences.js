/**
 * Appel par QR code en séance (phase I1).
 *  - AppelsSeance : l'appel ouvert par l'enseignant pour une séance, avec le secret qui signe le
 *    code affiché (il change toutes les 30 secondes) ; fermé à la fin de l'appel.
 *  - Presences : un étudiant présent à une séance, par scan du code ou coché par l'enseignant.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    const versSeance = {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Affectations", key: "id_affectation" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    };
    await queryInterface.createTable("AppelsSeance", {
        id_affectation: { ...versSeance, primaryKey: true },
        secret: { type: DataTypes.STRING(64), allowNull: false },
        ouvert_le: { type: DataTypes.DATE, allowNull: false },
        ferme_le: { type: DataTypes.DATE, allowNull: true },
        id_user_ouverture: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Users", key: "id_user" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
        },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.createTable("Presences", {
        id_presence: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_affectation: versSeance,
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Users", key: "id_user" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        source: { type: DataTypes.ENUM("qr", "manuel"), allowNull: false, defaultValue: "qr" },
        marque_le: { type: DataTypes.DATE, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("Presences", ["id_affectation", "id_user"], { unique: true, name: "presences_seance_etudiant" });
    await queryInterface.addIndex("Presences", ["id_user"]);
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("Presences");
    await queryInterface.dropTable("AppelsSeance");
};
