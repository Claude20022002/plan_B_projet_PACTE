import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Historique des désactivations d'un compte (lot ME-17) : désactivation, programmation,
 * annulation d'une programmation, report d'une programmation, réactivation, anonymisation.
 */
const Desactivation = sequelize.define(
    "Desactivation",
    {
        id_desactivation: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        action: { type: DataTypes.STRING(20), allowNull: false },
        motif: { type: DataTypes.STRING(20), allowNull: true },
        effet_le: { type: DataTypes.DATEONLY, allowNull: true },
        id_auteur: { type: DataTypes.INTEGER, allowNull: true },
        details: { type: DataTypes.JSON, allowNull: true },
    },
    { tableName: "Desactivations", freezeTableName: true }
);

export default Desactivation;
