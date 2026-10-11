import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Demande de changement du téléphone lié à un compte étudiant pour l'appel (R-10) : en attente, acceptée ou refusée. */
const DemandeTelephone = sequelize.define(
    "DemandeTelephone",
    {
        id_demande: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        appareil: { type: DataTypes.STRING(64), allowNull: false },
        motif: DataTypes.STRING(255),
        statut: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "en_attente" },
        id_user_admin: { type: DataTypes.INTEGER, allowNull: true },
        decidee_le: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "DemandesTelephone", freezeTableName: true }
);

export default DemandeTelephone;
