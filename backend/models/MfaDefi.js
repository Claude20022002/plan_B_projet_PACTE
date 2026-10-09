import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Connexion en attente du code de double authentification (5 minutes, 5 essais ; empreinte seule). */
const MfaDefi = sequelize.define(
    "MfaDefi",
    {
        defi_hash: { type: DataTypes.STRING(64), primaryKey: true },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        mobile: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        essais: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        expire_le: { type: DataTypes.DATE, allowNull: false },
    },
    { tableName: "MfaDefis", freezeTableName: true }
);

export default MfaDefi;
