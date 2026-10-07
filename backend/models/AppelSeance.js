import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Appel ouvert pour une séance (I1) : son secret signe le code QR affiché, qui change toutes les 30 s. */
const AppelSeance = sequelize.define(
    "AppelSeance",
    {
        id_affectation: { type: DataTypes.INTEGER, primaryKey: true },
        secret: { type: DataTypes.STRING(64), allowNull: false },
        ouvert_le: { type: DataTypes.DATE, allowNull: false },
        ferme_le: { type: DataTypes.DATE, allowNull: true },
        id_user_ouverture: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "AppelsSeance", freezeTableName: true }
);

export default AppelSeance;
