import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Salle d'une épreuve et nombre d'étudiants qui y composent (au plus sa capacité d'examen). */
const SessionExamenSalle = sequelize.define(
    "SessionExamenSalle",
    {
        id_session: { type: DataTypes.INTEGER, primaryKey: true },
        id_salle: { type: DataTypes.INTEGER, primaryKey: true },
        effectif: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: "SessionExamenSalles", freezeTableName: true }
);

export default SessionExamenSalle;
