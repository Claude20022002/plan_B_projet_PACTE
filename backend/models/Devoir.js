import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Quiz ClassQuiz donné en devoir noté dans un module ; questions copiées au moment du devoir. */
const Devoir = sequelize.define(
    "Devoir",
    {
        id_devoir: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        titre: { type: DataTypes.STRING(255), allowNull: false },
        quiz_id: { type: DataTypes.STRING(64), allowNull: false },
        questions: { type: DataTypes.JSON, allowNull: false },
        id_cours: { type: DataTypes.INTEGER, allowNull: false },
        id_groupe: { type: DataTypes.INTEGER, allowNull: true },
        id_user_enseignant: { type: DataTypes.INTEGER, allowNull: false },
        date_limite: { type: DataTypes.DATE, allowNull: false },
    },
    { tableName: "Devoirs", freezeTableName: true }
);

export default Devoir;
