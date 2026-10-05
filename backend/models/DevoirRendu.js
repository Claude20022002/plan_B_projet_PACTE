import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Copie rendue par un étudiant (une seule), corrigée par Planner et notée sur 20. */
const DevoirRendu = sequelize.define(
    "DevoirRendu",
    {
        id_devoir_rendu: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_devoir: { type: DataTypes.INTEGER, allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        reponses: { type: DataTypes.JSON, allowNull: false },
        bonnes: { type: DataTypes.INTEGER, allowNull: false },
        notees: { type: DataTypes.INTEGER, allowNull: false },
        note: { type: DataTypes.DECIMAL(4, 2), allowNull: false },
        rendu_le: { type: DataTypes.DATE, allowNull: false },
    },
    { tableName: "DevoirsRendus", freezeTableName: true }
);

export default DevoirRendu;
