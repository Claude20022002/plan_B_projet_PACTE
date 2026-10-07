import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Copie rendue par un étudiant (une seule) : corrigée par Planner (quiz) ou notée par l'enseignant (fichier), sur 20. */
const DevoirRendu = sequelize.define(
    "DevoirRendu",
    {
        id_devoir_rendu: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_devoir: { type: DataTypes.INTEGER, allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        reponses: { type: DataTypes.JSON, allowNull: true },
        bonnes: { type: DataTypes.INTEGER, allowNull: true },
        notees: { type: DataTypes.INTEGER, allowNull: true },
        // Nulle tant que l'enseignant n'a pas corrigé une copie fichier
        note: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
        commentaire: { type: DataTypes.TEXT, allowNull: true },
        note_le: { type: DataTypes.DATE, allowNull: true },
        en_retard: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        rendu_le: { type: DataTypes.DATE, allowNull: false },
    },
    { tableName: "DevoirsRendus", freezeTableName: true }
);

export default DevoirRendu;
