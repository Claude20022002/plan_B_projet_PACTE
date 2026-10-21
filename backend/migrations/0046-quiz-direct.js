/**
 * Quiz en direct du Studio (docs/plans/sortie-classquiz.md, lot SC-1a) : une diffusion de plus,
 * question par question au signal de l'enseignant, qui remplacera les parties de ClassQuiz.
 *  - SessionsQuiz gagne son mode (« rythme » : chacun à son rythme, « direct ») et, en direct,
 *    l'étape en cours, la question projetée, l'heure de son ouverture et un numéro de version ;
 *  - JoueursDirect : les étudiants qui ont rejoint une diffusion en direct ;
 *  - ReponsesDirect : une réponse par étudiant et par question, corrigée et chronométrée par le
 *    serveur (justesse et rapidité, décision du 20 octobre 2026).
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    const user = { type: DataTypes.INTEGER, allowNull: false, references: { model: "Users", key: "id_user" }, onDelete: "CASCADE", onUpdate: "CASCADE" };
    const session = { type: DataTypes.INTEGER, allowNull: false, references: { model: "SessionsQuiz", key: "id_session" }, onDelete: "CASCADE", onUpdate: "CASCADE" };
    const dates = { createdAt: { type: DataTypes.DATE, allowNull: false }, updatedAt: { type: DataTypes.DATE, allowNull: false } };

    await queryInterface.addColumn("SessionsQuiz", "mode", { type: DataTypes.STRING(10), allowNull: false, defaultValue: "rythme" });
    await queryInterface.addColumn("SessionsQuiz", "direct_etape", { type: DataTypes.STRING(12), allowNull: true });
    await queryInterface.addColumn("SessionsQuiz", "direct_index", { type: DataTypes.INTEGER, allowNull: true });
    await queryInterface.addColumn("SessionsQuiz", "direct_debut_ms", { type: DataTypes.BIGINT, allowNull: true });
    await queryInterface.addColumn("SessionsQuiz", "direct_version", { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 });

    await queryInterface.createTable("JoueursDirect", {
        id_joueur: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_session: session,
        id_user: user,
        ...dates,
    });
    await queryInterface.addIndex("JoueursDirect", ["id_session", "id_user"], { name: "joueurs_direct_unique", unique: true });

    await queryInterface.createTable("ReponsesDirect", {
        id_reponse: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_session: session,
        id_user: user,
        index_question: { type: DataTypes.INTEGER, allowNull: false },
        reponse: { type: DataTypes.JSON, allowNull: true },
        statut: { type: DataTypes.STRING(12), allowNull: false },
        part: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
        points: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        delai_ms: { type: DataTypes.INTEGER, allowNull: false },
        ...dates,
    });
    await queryInterface.addIndex("ReponsesDirect", ["id_session", "index_question", "id_user"], { name: "reponses_direct_unique", unique: true });
};

export const down = async ({ queryInterface }) => {
    for (const table of ["ReponsesDirect", "JoueursDirect"]) await queryInterface.dropTable(table);
    for (const colonne of ["direct_version", "direct_debut_ms", "direct_index", "direct_etape", "mode"]) await queryInterface.removeColumn("SessionsQuiz", colonne);
};
