import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { TYPES_GROUPE } from "../config/referentiel.js";

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
        // Promotion ⊃ groupes de TD ⊃ demi-groupes de TP
        type_groupe: {
            type: DataTypes.ENUM(...TYPES_GROUPE),
            allowNull: false,
            defaultValue: "td",
        },
        id_groupe_parent: DataTypes.INTEGER,
        // Année d'études (1 à 5) : « 4A | IIIA (S7) »
        annee: DataTypes.INTEGER,
    },
    {
        tableName: "Groupes",
        freezeTableName: true,
    }
);

export default Groupe;
