import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Valeur d'un paramètre du catalogue dans une version, pour une portée : l'établissement (id_portee
 * vide), un cycle, un niveau, une filière ou une cible individuelle. « retiree » annule le réglage.
 */
const ValeurParametre = sequelize.define(
    "ValeurParametre",
    {
        id_version: { type: DataTypes.INTEGER, primaryKey: true },
        cle: { type: DataTypes.STRING(64), primaryKey: true },
        portee: { type: DataTypes.STRING(20), primaryKey: true },
        id_portee: { type: DataTypes.STRING(50), primaryKey: true, defaultValue: "" },
        valeur: { type: DataTypes.JSON, allowNull: true },
        force: { type: DataTypes.ENUM("strict", "souple"), allowNull: true },
        poids: { type: DataTypes.INTEGER, allowNull: true },
        retiree: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
        tableName: "ValeursParametres",
        freezeTableName: true,
        timestamps: false,
    }
);

export default ValeurParametre;
