import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const HistoriqueAffectation = sequelize.define(
    "HistoriqueAffectation",
    {
        id_historique: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        action: {
            type: DataTypes.ENUM(
                "creation",
                "modification",
                "suppression",
                "annulation"
            ),
            allowNull: false,
        },
        date_action: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        anciens_donnees: DataTypes.JSON,
        nouveaux_donnees: DataTypes.JSON,
        commentaire: DataTypes.TEXT,
        id_affectation: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: true,
            // Les relations sont gérées via les associations dans models/index.js
        },
    },
    {
        tableName: "HistoriqueAffectations",
        freezeTableName: true,
    }
);

export default HistoriqueAffectation;
