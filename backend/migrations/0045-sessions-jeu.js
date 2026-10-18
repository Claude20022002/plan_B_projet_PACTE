/**
 * Sessions de jeu : l'enseignant lance un jeu pour un module et projette un QR code et un code.
 *  - SessionsJeu : la session (jeu, module, mode « individuel » ou « collectif », code d'accès) ;
 *    en mode collectif, le défi projeté et les commandes déjà jouées par la classe ;
 *  - ParticipationsJeu : les étudiants qui ont rejoint la session ;
 *  - PropositionsJeu : en mode collectif, les réponses envoyées par les étudiants, parmi
 *    lesquelles l'enseignant choisit celle qui est jouée au tableau.
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    const user = { type: DataTypes.INTEGER, allowNull: false, references: { model: "Users", key: "id_user" }, onDelete: "CASCADE", onUpdate: "CASCADE" };
    const session = { type: DataTypes.INTEGER, allowNull: false, references: { model: "SessionsJeu", key: "id_session_jeu" }, onDelete: "CASCADE", onUpdate: "CASCADE" };
    const dates = { createdAt: { type: DataTypes.DATE, allowNull: false }, updatedAt: { type: DataTypes.DATE, allowNull: false } };

    await queryInterface.createTable("SessionsJeu", {
        id_session_jeu: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code_jeu: { type: DataTypes.STRING(40), allowNull: false },
        mode: { type: DataTypes.STRING(12), allowNull: false },
        id_user: user,
        id_cours: { type: DataTypes.INTEGER, allowNull: false, references: { model: "Cours", key: "id_cours" }, onDelete: "CASCADE", onUpdate: "CASCADE" },
        code: { type: DataTypes.STRING(8), allowNull: false },
        statut: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "ouverte" },
        id_defi: { type: DataTypes.STRING(80), allowNull: true },
        commandes: { type: DataTypes.JSON, allowNull: true },
        reussi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        ...dates,
    });
    await queryInterface.addIndex("SessionsJeu", ["code"], { name: "sessions_jeu_code", unique: true });
    await queryInterface.addIndex("SessionsJeu", ["id_user", "createdAt"], { name: "sessions_jeu_user_date" });

    await queryInterface.createTable("ParticipationsJeu", {
        id_participation: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_session_jeu: session,
        id_user: user,
        ...dates,
    });
    await queryInterface.addIndex("ParticipationsJeu", ["id_session_jeu", "id_user"], { name: "participations_jeu_unique", unique: true });

    await queryInterface.createTable("PropositionsJeu", {
        id_proposition: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_session_jeu: session,
        id_user: user,
        id_defi: { type: DataTypes.STRING(80), allowNull: false },
        texte: { type: DataTypes.STRING(300), allowNull: false },
        statut: { type: DataTypes.STRING(10), allowNull: false, defaultValue: "attente" },
        ...dates,
    });
    await queryInterface.addIndex("PropositionsJeu", ["id_session_jeu", "statut"], { name: "propositions_jeu_session" });
};

export const down = async ({ queryInterface }) => {
    for (const table of ["PropositionsJeu", "ParticipationsJeu", "SessionsJeu"]) await queryInterface.dropTable(table);
};
