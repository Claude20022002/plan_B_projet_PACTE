import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Version datée des réglages du moteur (D-07). Une fois appliquée, elle ne change plus (I-D5). */
const VersionParametres = sequelize.define(
    "VersionParametres",
    {
        id_version: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        libelle: { type: DataTypes.STRING(200), allowNull: true },
        date_effet: { type: DataTypes.DATEONLY, allowNull: false },
        statut: { type: DataTypes.ENUM("brouillon", "appliquee", "annulee"), allowNull: false, defaultValue: "brouillon" },
        impact: { type: DataTypes.JSON, allowNull: true },
        id_auteur: { type: DataTypes.INTEGER, allowNull: true },
        appliquee_le: { type: DataTypes.DATE, allowNull: true },
        annule_version: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
        tableName: "VersionsParametres",
        freezeTableName: true,
    }
);

export default VersionParametres;
