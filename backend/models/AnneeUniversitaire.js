import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const AnneeUniversitaire = sequelize.define(
    "AnneeUniversitaire",
    {
        id_annee: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        libelle: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        },
        date_debut: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        date_fin: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        tableName: "AnneesUniversitaires",
        freezeTableName: true,
    }
);

export default AnneeUniversitaire;
