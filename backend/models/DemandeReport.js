import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const DemandeReport = sequelize.define(
    "DemandeReport",
    {
        id_demande: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        date_demande: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        motif: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        nouvelle_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        statut_demande: {
            type: DataTypes.ENUM("en_attente", "approuve", "refuse"),
            defaultValue: "en_attente",
        },
        id_user_enseignant: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
        // Créneau visé ; sans lui, le créneau de même rang le jour de la nouvelle date
        id_creneau_nouveau: DataTypes.INTEGER,
        id_affectation: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
    },
    {
        tableName: "DemandeReports",
        freezeTableName: true,
    }
);

export default DemandeReport;
