import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Etudiant = sequelize.define(
    "Etudiant",
    {
        id_user: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            // Les relations sont gérées via les associations dans models/index.js
        },
        numero_etudiant: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        niveau: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        date_inscription: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        tableName: "Etudiants",
        freezeTableName: true,
    }
);

export default Etudiant;
