import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Modèles du quiz en direct du Studio (migration 0046), réunis ici pour ne pas allonger
 * models/index.js, qui les réexporte avec leurs relations. La diffusion elle-même est une
 * SessionQuiz en mode « direct » (models/studio.js).
 */

const options = (tableName) => ({ tableName, freezeTableName: true });

/** Un étudiant qui a rejoint une diffusion en direct. */
export const JoueurDirect = sequelize.define(
    "JoueurDirect",
    {
        id_joueur: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_session: { type: DataTypes.INTEGER, allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
    },
    options("JoueursDirect")
);

/** La réponse d'un étudiant à une question : corrigée et chronométrée par le serveur. */
export const ReponseDirect = sequelize.define(
    "ReponseDirect",
    {
        id_reponse: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_session: { type: DataTypes.INTEGER, allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        index_question: { type: DataTypes.INTEGER, allowNull: false },
        reponse: { type: DataTypes.JSON, allowNull: true },
        // « juste », « partiel » ou « faux » (shared/quiz/studio/correction.js)
        statut: { type: DataTypes.STRING(12), allowNull: false },
        // Part des points de la question obtenue (0 à 1)
        part: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
        // Points du jeu : justesse et rapidité (shared/quiz/studio/direct.js)
        points: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        delai_ms: { type: DataTypes.INTEGER, allowNull: false },
    },
    options("ReponsesDirect")
);

/** Relations, appelées par models/index.js une fois Users et SessionQuiz définis. */
export const relierQuizDirect = ({ Users, SessionQuiz }) => {
    SessionQuiz.hasMany(JoueurDirect, { foreignKey: "id_session", as: "joueurs", onDelete: "CASCADE" });
    SessionQuiz.hasMany(ReponseDirect, { foreignKey: "id_session", as: "reponsesDirect", onDelete: "CASCADE" });
    JoueurDirect.belongsTo(Users, { foreignKey: "id_user", as: "etudiant", targetKey: "id_user" });
    ReponseDirect.belongsTo(Users, { foreignKey: "id_user", as: "etudiant", targetKey: "id_user" });
};
