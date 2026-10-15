import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Modèles du Studio quiz (migration 0044, docs/plans/studio-quiz.md), réunis ici pour ne pas
 * allonger models/index.js, qui les réexporte avec leurs relations.
 */

const options = (tableName) => ({ tableName, freezeTableName: true });

/** Un quiz de la banque de l'enseignant : sans classe ni module (étiquettes libres). */
export const Questionnaire = sequelize.define(
    "Questionnaire",
    {
        id_questionnaire: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        titre: { type: DataTypes.STRING(200), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        etiquettes: { type: DataTypes.JSON, allowNull: true },
        reglages: { type: DataTypes.JSON, allowNull: false },
        // null, « en_cours » ou « erreur » : génération par l'IA de ses questions
        generation_statut: { type: DataTypes.STRING(20), allowNull: true },
        generation_erreur: { type: DataTypes.STRING(500), allowNull: true },
        id_usage_ia: { type: DataTypes.INTEGER, allowNull: true },
        archive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    options("Questionnaires")
);

/** Une question ; `donnees` dépend du type (shared/quiz/studio/types.js). */
export const QuestionQuiz = sequelize.define(
    "QuestionQuiz",
    {
        id_question: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_questionnaire: { type: DataTypes.INTEGER, allowNull: false },
        ordre: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        type: { type: DataTypes.STRING(30), allowNull: false },
        enonce: { type: DataTypes.TEXT, allowNull: false },
        points: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 1 },
        explication: { type: DataTypes.TEXT, allowNull: true },
        id_media: { type: DataTypes.INTEGER, allowNull: true },
        extrait: { type: DataTypes.JSON, allowNull: true },
        donnees: { type: DataTypes.JSON, allowNull: false },
        // Proposée par l'IA et pas encore relue : le quiz ne s'ouvre pas aux étudiants
        a_relire: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        origine: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "manuel" },
        source: { type: DataTypes.STRING(50), allowNull: true },
    },
    options("QuestionsQuestionnaire")
);

/** Image, audio ou vidéo d'une question ; le contenu n'est lu qu'à la diffusion. */
export const MediaQuiz = sequelize.define(
    "MediaQuiz",
    {
        id_media: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        type: { type: DataTypes.STRING(10), allowNull: false },
        type_mime: { type: DataTypes.STRING(100), allowNull: false },
        nom: { type: DataTypes.STRING(200), allowNull: false },
        taille: { type: DataTypes.INTEGER, allowNull: false },
        empreinte: { type: DataTypes.CHAR(64), allowNull: false },
        duree: { type: DataTypes.FLOAT, allowNull: true },
        origine: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "depot" },
        // Texte de remplacement d'une image, ou résumé d'un son (accessibilité)
        description: { type: DataTypes.STRING(500), allowNull: true },
        // { texte, segments: [{ debut, fin, texte }] } : transcription d'un audio ou d'une vidéo
        transcription: { type: DataTypes.JSON, allowNull: true },
        contenu: { type: DataTypes.BLOB("long"), allowNull: false },
    },
    options("MediasQuiz")
);

/** Passation ouverte par code ; `questions` est la copie figée au moment de l'ouverture. */
export const SessionQuiz = sequelize.define(
    "SessionQuiz",
    {
        id_session: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_questionnaire: { type: DataTypes.INTEGER, allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        code: { type: DataTypes.STRING(8), allowNull: false, unique: true },
        titre: { type: DataTypes.STRING(200), allowNull: false },
        questions: { type: DataTypes.JSON, allowNull: false },
        reglages: { type: DataTypes.JSON, allowNull: false },
        ouverture: { type: DataTypes.DATE, allowNull: true },
        fermeture: { type: DataTypes.DATE, allowNull: true },
        statut: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "ouverte" },
        // Aperçu de l'enseignant : jamais montré aux étudiants ni compté dans les résultats
        essai: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        id_groupe: { type: DataTypes.INTEGER, allowNull: true },
        id_affectation: { type: DataTypes.INTEGER, allowNull: true },
    },
    options("SessionsQuiz")
);

/** Copie d'un étudiant : ordre tiré, réponses enregistrées au fil de l'eau, correction. */
export const TentativeQuiz = sequelize.define(
    "TentativeQuiz",
    {
        id_tentative: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_session: { type: DataTypes.INTEGER, allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
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
    },
    options("TentativesQuiz")
);

/** Un appel à l'IA : nature (quiz, question, image, voix, transcription), coût, support gardé 30 jours. */
export const UsageIaQuiz = sequelize.define(
    "UsageIaQuiz",
    {
        id_usage: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        nature: { type: DataTypes.STRING(20), allowNull: false },
        id_questionnaire: { type: DataTypes.INTEGER, allowNull: true },
        statut: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "en_cours" },
        erreur: { type: DataTypes.STRING(500), allowNull: true },
        modele: { type: DataTypes.STRING(100), allowNull: true },
        reglages: { type: DataTypes.JSON, allowNull: true },
        contexte: { type: DataTypes.TEXT("long"), allowNull: true },
        jetons_entree: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        jetons_sortie: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        duree_ms: { type: DataTypes.INTEGER, allowNull: true },
    },
    options("UsagesIaQuiz")
);

/** Relations, appelées par models/index.js une fois Users et Groupe définis. */
export const relierStudio = ({ Users }) => {
    Questionnaire.hasMany(QuestionQuiz, { foreignKey: "id_questionnaire", as: "questions", onDelete: "CASCADE" });
    QuestionQuiz.belongsTo(Questionnaire, { foreignKey: "id_questionnaire", as: "questionnaire" });
    QuestionQuiz.belongsTo(MediaQuiz, { foreignKey: "id_media", as: "media" });
    Questionnaire.hasMany(SessionQuiz, { foreignKey: "id_questionnaire", as: "sessions", onDelete: "CASCADE" });
    SessionQuiz.belongsTo(Questionnaire, { foreignKey: "id_questionnaire", as: "questionnaire" });
    SessionQuiz.hasMany(TentativeQuiz, { foreignKey: "id_session", as: "tentatives", onDelete: "CASCADE" });
    TentativeQuiz.belongsTo(SessionQuiz, { foreignKey: "id_session", as: "session" });
    TentativeQuiz.belongsTo(Users, { foreignKey: "id_user", as: "etudiant", targetKey: "id_user" });
};
