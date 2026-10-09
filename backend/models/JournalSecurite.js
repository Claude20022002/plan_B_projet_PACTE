import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Événement de sécurité (services/journalSecurite.js) : en écriture seule, sans clé étrangère. */
const JournalSecurite = sequelize.define(
    "JournalSecurite",
    {
        id_evenement: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        evenement: { type: DataTypes.STRING(40), allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: true },
        email: { type: DataTypes.STRING(255), allowNull: true },
        id_acteur: { type: DataTypes.INTEGER, allowNull: true },
        ip: { type: DataTypes.STRING(45), allowNull: true },
        user_agent: { type: DataTypes.STRING(255), allowNull: true },
        details: { type: DataTypes.JSON, allowNull: true },
    },
    { tableName: "JournalSecurite", freezeTableName: true, updatedAt: false }
);

export default JournalSecurite;
