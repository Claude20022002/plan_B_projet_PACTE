import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Affectation = sequelize.define(
    "Affectation",
    {
        id_affectation: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        date_seance: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        statut: {
            type: DataTypes.ENUM("planifie", "confirme", "annule", "reporte"),
            defaultValue: "planifie",
        },
        commentaire: DataTypes.TEXT,
        id_cours: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
        id_groupe: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
        id_user_enseignant: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
        id_salle: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
        id_creneau: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
        id_user_admin: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
    },
    {
        tableName: "Affectations",
        freezeTableName: true,
    }
);

export default Affectation;
