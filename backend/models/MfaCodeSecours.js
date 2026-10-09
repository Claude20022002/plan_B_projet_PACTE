import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Code de secours de la double authentification (usage unique ; seule l'empreinte est gardée). */
const MfaCodeSecours = sequelize.define(
    "MfaCodeSecours",
    {
        id_code: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        code_hash: { type: DataTypes.STRING(64), allowNull: false },
        utilise_le: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "MfaCodesSecours", freezeTableName: true }
);

export default MfaCodeSecours;
