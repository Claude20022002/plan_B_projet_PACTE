import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { CODES_PERIODE } from "../config/referentiel.js";

/** Semestre d'une année universitaire : bornes et nombre de semaines de cours. */
const Periode = sequelize.define(
    "Periode",
    {
        id_periode: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        id_annee: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        code: {
            type: DataTypes.ENUM(...CODES_PERIODE),
            allowNull: false,
        },
        libelle: DataTypes.STRING(100),
        date_debut: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        date_fin: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        nb_semaines: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "Periodes",
        freezeTableName: true,
        indexes: [{ unique: true, fields: ["id_annee", "code"] }],
    }
);

export default Periode;
