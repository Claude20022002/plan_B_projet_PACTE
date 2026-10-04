import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Retour anonyme sur une séance (I7) : note de 1 à 5, un mot ; aucun lien avec l'étudiant. */
const RetourSeance = sequelize.define(
    "RetourSeance",
    {
        id_retour: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_affectation: { type: DataTypes.INTEGER, allowNull: false },
        note: { type: DataTypes.TINYINT, allowNull: false, validate: { min: 1, max: 5 } },
        mot: DataTypes.STRING(40),
        jour: { type: DataTypes.DATEONLY, allowNull: false },
    },
    { tableName: "RetoursSeance", freezeTableName: true, timestamps: false }
);

export default RetourSeance;
