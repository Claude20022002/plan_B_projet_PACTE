/**
 * Résultats des parties ClassQuiz (phase Q) : le fork envoie les scores en fin de partie
 * (webhook game.finished). Chaque score est rattaché à l'étudiant quand le joueur est arrivé
 * depuis la plateforme (jeton signé), donc à la séance et au module de la partie.
 *  - QuizParties : fin de partie, nombre de questions et de joueurs, nuages de mots (réponses
 *    libres regroupées).
 *  - QuizResultats : un score par joueur (pseudo), avec l'étudiant s'il est connu.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    await queryInterface.addColumn("QuizParties", "terminee_le", { type: DataTypes.DATE, allowNull: true });
    await queryInterface.addColumn("QuizParties", "nb_questions", { type: DataTypes.INTEGER, allowNull: true });
    await queryInterface.addColumn("QuizParties", "nb_joueurs", { type: DataTypes.INTEGER, allowNull: true });
    await queryInterface.addColumn("QuizParties", "nuages", { type: DataTypes.JSON, allowNull: true });

    await queryInterface.createTable("QuizResultats", {
        id_quiz_resultat: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_quiz_partie: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: "QuizParties", key: "id_quiz_partie" },
            onDelete: "CASCADE",
            onUpdate: "CASCADE",
        },
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: "Users", key: "id_user" },
            onDelete: "SET NULL",
            onUpdate: "CASCADE",
        },
        pseudo: { type: DataTypes.STRING(60), allowNull: false },
        score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        bonnes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        rang: { type: DataTypes.INTEGER, allowNull: false },
        createdAt: { type: DataTypes.DATE, allowNull: false },
        updatedAt: { type: DataTypes.DATE, allowNull: false },
    });
    await queryInterface.addIndex("QuizResultats", ["id_quiz_partie", "pseudo"], { unique: true, name: "quiz_resultats_partie_pseudo" });
    await queryInterface.addIndex("QuizResultats", ["id_user"]);
};

export const down = async ({ queryInterface }) => {
    await queryInterface.dropTable("QuizResultats");
    for (const colonne of ["nuages", "nb_joueurs", "nb_questions", "terminee_le"]) await queryInterface.removeColumn("QuizParties", colonne);
};
