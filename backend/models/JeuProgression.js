import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Défi réussi par un joueur ; une ligne par défi (la première réussite compte). */
const JeuProgression = sequelize.define(
    "JeuProgression",
    {
        id_jeu_progression: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        code_jeu: { type: DataTypes.STRING(40), allowNull: false },
        id_defi: { type: DataTypes.STRING(60), allowNull: false },
        indices: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 0 },
        points: { type: DataTypes.INTEGER, allowNull: false },
        reussi_le: { type: DataTypes.DATE, allowNull: false },
    },
    { tableName: "JeuxProgressions", freezeTableName: true }
);

export default JeuProgression;
