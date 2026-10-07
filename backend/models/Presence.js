import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Présence d'un étudiant à une séance (I1) : par scan du QR ou cochée par l'enseignant. */
const Presence = sequelize.define(
    "Presence",
    {
        id_presence: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_affectation: { type: DataTypes.INTEGER, allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        source: { type: DataTypes.ENUM("qr", "manuel"), allowNull: false, defaultValue: "qr" },
        marque_le: { type: DataTypes.DATE, allowNull: false },
    },
    { tableName: "Presences", freezeTableName: true }
);

export default Presence;
