import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Partie ClassQuiz lancée par un enseignant (webhook du fork), éventuellement liée à sa séance. */
const QuizPartie = sequelize.define(
    "QuizPartie",
    {
        id_quiz_partie: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        game_id: { type: DataTypes.STRING(64), allowNull: false, unique: true },
        pin: { type: DataTypes.STRING(12), allowNull: false },
        titre: { type: DataTypes.STRING(255), allowNull: false },
        mode: { type: DataTypes.STRING(30), allowNull: true },
        id_user_enseignant: { type: DataTypes.INTEGER, allowNull: false },
        id_affectation: { type: DataTypes.INTEGER, allowNull: true },
        demarree_le: { type: DataTypes.DATE, allowNull: false },
    },
    { tableName: "QuizParties", freezeTableName: true }
);

export default QuizPartie;
