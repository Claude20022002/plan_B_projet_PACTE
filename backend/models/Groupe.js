import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Groupe = sequelize.define(
    "Groupe",
    {
        id_groupe: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nom_groupe: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        niveau: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        effectif: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        annee_scolaire: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        id_filiere: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
    },
    {
        tableName: "Groupes",
        freezeTableName: true,
    }
);

export default Groupe;
