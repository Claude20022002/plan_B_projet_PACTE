import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Adresse secrète du flux ICS personnel (R4) : lecture seule, renouvelable (l'ancienne cesse de marcher). */
const AbonnementCalendrier = sequelize.define(
    "AbonnementCalendrier",
    {
        id_user: { type: DataTypes.INTEGER, primaryKey: true },
        jeton: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    },
    { tableName: "AbonnementsCalendrier", freezeTableName: true }
);

export default AbonnementCalendrier;
