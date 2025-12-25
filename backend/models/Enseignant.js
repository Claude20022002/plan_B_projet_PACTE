import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Enseignant = sequelize.define(
    "Enseignant",
    {
        id_user: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            // Les relations sont gérées via les associations dans models/index.js
        },
        specialite: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        departement: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        grade: DataTypes.STRING,
        bureau: DataTypes.STRING,
    },
    {
        tableName: "Enseignants",
        freezeTableName: true,
    }
);

export default Enseignant;
