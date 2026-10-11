import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Décision de l'administration sur une séance réalisée, avant l'export de la paie (R-11) : confirmée ou écartée. */
const VisaSeance = sequelize.define(
    "VisaSeance",
    {
        id_affectation: { type: DataTypes.INTEGER, primaryKey: true },
        decision: { type: DataTypes.STRING(20), allowNull: false },
        motif: DataTypes.STRING(255),
        id_user_admin: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "VisasSeance", freezeTableName: true }
);

export default VisaSeance;
