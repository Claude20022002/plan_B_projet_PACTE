import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Appartenir = sequelize.define(
    "Appartenir",
    {
        id_user_etudiant: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            // Les relations sont gérées via les associations dans models/index.js
        },
        id_groupe: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            // Les relations sont gérées via les associations dans models/index.js
        },
    },
    {
        tableName: "Appartenir",
        freezeTableName: true,
    }
);

export default Appartenir;
