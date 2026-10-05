/**
 * Phase Q — parties ClassQuiz lancées par un enseignant, signalées par le webhook du fork
 * (« partie démarrée »). Rattachées à la séance en cours de l'enseignant quand il y en a une :
 * ses étudiants sont prévenus et la retrouvent dans l'application sans saisir de code.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.createTable("QuizParties", {
        id_quiz_partie: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        game_id: { type: DataTypes.STRING(64), allowNull: false, unique: true },
        pin: { type: DataTypes.STRING(12), allowNull: false },
        titre: { type: DataTypes.STRING(255), allowNull: false },
        mode: { type: DataTypes.STRING(30), allowNull: true },
        id_user_enseignant: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "Users", key: "id_user" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        id_affectation: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Affectations", key: "id_affectation" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
        },
        demarree_le: { type: DataTypes.DATE, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("QuizParties", ["id_affectation"]);
    await queryInterface.addIndex("QuizParties", ["id_user_enseignant", "demarree_le"]);
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("QuizParties");
};
