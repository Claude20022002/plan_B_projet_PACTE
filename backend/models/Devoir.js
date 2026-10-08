import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Devoir noté dans un module : quiz ClassQuiz (questions copiées au moment du devoir, corrigé par
 * Planner) ou devoir « fichier » (consignes, énoncé facultatif, copie notée par l'enseignant).
 */
const Devoir = sequelize.define(
    "Devoir",
    {
        id_devoir: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        titre: { type: DataTypes.STRING(255), allowNull: false },
        type: { type: DataTypes.ENUM("quiz", "fichier"), allowNull: false, defaultValue: "quiz" },
        consignes: { type: DataTypes.TEXT, allowNull: true },
        quiz_id: { type: DataTypes.STRING(64), allowNull: true },
        questions: { type: DataTypes.JSON, allowNull: true },
        id_cours: { type: DataTypes.INTEGER, allowNull: false },
        id_groupe: { type: DataTypes.INTEGER, allowNull: true },
        id_user_enseignant: { type: DataTypes.INTEGER, allowNull: false },
        date_limite: { type: DataTypes.DATE, allowNull: false },
        // Activités : but (vérifier la compréhension ou s'entraîner) et notion visée, facultative
        but: { type: DataTypes.ENUM("verifier", "entrainer"), allowNull: false, defaultValue: "verifier" },
        notion: { type: DataTypes.STRING(120), allowNull: true },
    },
    { tableName: "Devoirs", freezeTableName: true }
);

export default Devoir;
