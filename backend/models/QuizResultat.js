import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Score d'un joueur dans une partie ClassQuiz ; l'étudiant est connu s'il venait de la plateforme. */
const QuizResultat = sequelize.define(
    "QuizResultat",
    {
        id_quiz_resultat: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_quiz_partie: { type: DataTypes.INTEGER, allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: true },
        pseudo: { type: DataTypes.STRING(60), allowNull: false },
        score: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        bonnes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        rang: { type: DataTypes.INTEGER, allowNull: false },
    },
    { tableName: "QuizResultats", freezeTableName: true }
);

export default QuizResultat;
