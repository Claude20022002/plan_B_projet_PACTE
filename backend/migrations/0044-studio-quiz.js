/**
 * Studio quiz (docs/plans/studio-quiz.md) : le moteur de quiz natif de Planner, sans ClassQuiz.
 *  - Questionnaires : la banque de l'enseignant, sans classe ni module (étiquettes libres) ;
 *  - QuestionsQuestionnaire : dix types de questions, données propres au type en JSON ;
 *  - MediasQuiz : images, audios et vidéos des questions (déposés ou produits par l'IA) ;
 *  - SessionsQuiz : une passation ouverte par code, avec la copie figée des questions ;
 *  - TentativesQuiz : la copie d'un étudiant (mélange, réponses, marques, correction) ;
 *  - UsagesIaQuiz : chaque appel à l'IA (quotas par nature, coût, texte du support 30 jours).
 */
export const up = async ({ queryInterface }) => {
    const { DataTypes } = await import("sequelize");
    const user = { type: DataTypes.INTEGER, allowNull: false, references: { model: "Users", key: "id_user" }, onDelete: "CASCADE", onUpdate: "CASCADE" };
    const dates = { createdAt: { type: DataTypes.DATE, allowNull: false }, updatedAt: { type: DataTypes.DATE, allowNull: false } };

    await queryInterface.createTable("Questionnaires", {
        id_questionnaire: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: user,
        titre: { type: DataTypes.STRING(200), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        etiquettes: { type: DataTypes.JSON, allowNull: true },
        reglages: { type: DataTypes.JSON, allowNull: false },
        generation_statut: { type: DataTypes.STRING(20), allowNull: true },
        generation_erreur: { type: DataTypes.STRING(500), allowNull: true },
        id_usage_ia: { type: DataTypes.INTEGER, allowNull: true },
        archive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        ...dates,
    });
    await queryInterface.addIndex("Questionnaires", ["id_user", "updatedAt"], { name: "questionnaires_user_date" });

    await queryInterface.createTable("MediasQuiz", {
        id_media: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: user,
        type: { type: DataTypes.STRING(10), allowNull: false },
        type_mime: { type: DataTypes.STRING(100), allowNull: false },
        nom: { type: DataTypes.STRING(200), allowNull: false },
        taille: { type: DataTypes.INTEGER, allowNull: false },
        empreinte: { type: DataTypes.CHAR(64), allowNull: false },
        duree: { type: DataTypes.FLOAT, allowNull: true },
        origine: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "depot" },
        description: { type: DataTypes.STRING(500), allowNull: true },
        transcription: { type: DataTypes.JSON, allowNull: true },
        contenu: { type: DataTypes.BLOB("long"), allowNull: false },
        ...dates,
    });
    await queryInterface.addIndex("MediasQuiz", ["id_user", "createdAt"], { name: "medias_quiz_user_date" });

    await queryInterface.createTable("QuestionsQuestionnaire", {
        id_question: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_questionnaire: { type: DataTypes.INTEGER, allowNull: false, references: { model: "Questionnaires", key: "id_questionnaire" }, onDelete: "CASCADE", onUpdate: "CASCADE" },
        ordre: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        type: { type: DataTypes.STRING(30), allowNull: false },
        enonce: { type: DataTypes.TEXT, allowNull: false },
        points: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 1 },
        explication: { type: DataTypes.TEXT, allowNull: true },
        id_media: { type: DataTypes.INTEGER, allowNull: true, references: { model: "MediasQuiz", key: "id_media" }, onDelete: "SET NULL", onUpdate: "CASCADE" },
        extrait: { type: DataTypes.JSON, allowNull: true },
        donnees: { type: DataTypes.JSON, allowNull: false },
        a_relire: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        origine: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "manuel" },
        source: { type: DataTypes.STRING(50), allowNull: true },
        ...dates,
    });
    await queryInterface.addIndex("QuestionsQuestionnaire", ["id_questionnaire", "ordre"], { name: "questions_questionnaire_ordre" });

    await queryInterface.createTable("SessionsQuiz", {
        id_session: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_questionnaire: { type: DataTypes.INTEGER, allowNull: false, references: { model: "Questionnaires", key: "id_questionnaire" }, onDelete: "CASCADE", onUpdate: "CASCADE" },
        id_user: user,
        code: { type: DataTypes.STRING(8), allowNull: false },
        titre: { type: DataTypes.STRING(200), allowNull: false },
        questions: { type: DataTypes.JSON, allowNull: false },
        reglages: { type: DataTypes.JSON, allowNull: false },
        ouverture: { type: DataTypes.DATE, allowNull: true },
        fermeture: { type: DataTypes.DATE, allowNull: true },
        statut: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "ouverte" },
        essai: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        id_groupe: { type: DataTypes.INTEGER, allowNull: true, references: { model: "Groupes", key: "id_groupe" }, onDelete: "SET NULL", onUpdate: "CASCADE" },
        id_affectation: { type: DataTypes.INTEGER, allowNull: true, references: { model: "Affectations", key: "id_affectation" }, onDelete: "SET NULL", onUpdate: "CASCADE" },
        ...dates,
    });
    await queryInterface.addIndex("SessionsQuiz", ["code"], { name: "sessions_quiz_code", unique: true });
    await queryInterface.addIndex("SessionsQuiz", ["id_user", "createdAt"], { name: "sessions_quiz_user_date" });
    await queryInterface.addIndex("SessionsQuiz", ["id_questionnaire"], { name: "sessions_quiz_questionnaire" });

    await queryInterface.createTable("TentativesQuiz", {
        id_tentative: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_session: { type: DataTypes.INTEGER, allowNull: false, references: { model: "SessionsQuiz", key: "id_session" }, onDelete: "CASCADE", onUpdate: "CASCADE" },
        id_user: user,
        numero: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        statut: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "en_cours" },
        debut: { type: DataTypes.DATE, allowNull: false },
        echeance: { type: DataTypes.DATE, allowNull: true },
        rendue_le: { type: DataTypes.DATE, allowNull: true },
        ordre: { type: DataTypes.JSON, allowNull: false },
        reponses: { type: DataTypes.JSON, allowNull: false },
        marquees: { type: DataTypes.JSON, allowNull: false },
        verrouillees: { type: DataTypes.JSON, allowNull: false },
        position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        corrections: { type: DataTypes.JSON, allowNull: true },
        points: { type: DataTypes.FLOAT, allowNull: true },
        max: { type: DataTypes.FLOAT, allowNull: true },
        pourcentage: { type: DataTypes.FLOAT, allowNull: true },
        complet: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        ...dates,
    });
    await queryInterface.addIndex("TentativesQuiz", ["id_session", "id_user"], { name: "tentatives_quiz_session_user" });
    await queryInterface.addIndex("TentativesQuiz", ["id_user", "createdAt"], { name: "tentatives_quiz_user_date" });

    await queryInterface.createTable("UsagesIaQuiz", {
        id_usage: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: user,
        nature: { type: DataTypes.STRING(20), allowNull: false },
        id_questionnaire: { type: DataTypes.INTEGER, allowNull: true, references: { model: "Questionnaires", key: "id_questionnaire" }, onDelete: "SET NULL", onUpdate: "CASCADE" },
        statut: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "en_cours" },
        erreur: { type: DataTypes.STRING(500), allowNull: true },
        modele: { type: DataTypes.STRING(100), allowNull: true },
        reglages: { type: DataTypes.JSON, allowNull: true },
        contexte: { type: DataTypes.TEXT("long"), allowNull: true },
        jetons_entree: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        jetons_sortie: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        duree_ms: { type: DataTypes.INTEGER, allowNull: true },
        ...dates,
    });
    await queryInterface.addIndex("UsagesIaQuiz", ["id_user", "nature", "createdAt"], { name: "usages_ia_quiz_user_nature" });
    await queryInterface.addIndex("UsagesIaQuiz", ["createdAt"], { name: "usages_ia_quiz_date" });
};

export const down = async ({ queryInterface }) => {
    for (const table of ["UsagesIaQuiz", "TentativesQuiz", "SessionsQuiz", "QuestionsQuestionnaire", "MediasQuiz", "Questionnaires"]) {
        await queryInterface.dropTable(table);
    }
};
