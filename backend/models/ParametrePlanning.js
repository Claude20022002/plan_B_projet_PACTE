import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Valeur modifiée d'un paramètre de planification (défauts : config/parametresPlanning.js). */
const ParametrePlanning = sequelize.define(
    "ParametrePlanning",
    {
        cle: {
            type: DataTypes.STRING(64),
            primaryKey: true,
        },
        valeur: {
            type: DataTypes.JSON,
            allowNull: false,
        },
    },
    {
        tableName: "ParametresPlanning",
        freezeTableName: true,
    }
);

export default ParametrePlanning;
