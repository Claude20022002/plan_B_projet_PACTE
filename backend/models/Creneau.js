import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Creneau = sequelize.define(
    "Creneau",
    {
        id_creneau: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        jour_semaine: {
            type: DataTypes.ENUM(
                "lundi",
                "mardi",
                "mercredi",
                "jeudi",
                "vendredi",
                "samedi",
                "dimanche"
            ),
            allowNull: false,
        },
        heure_debut: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        heure_fin: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        periode: DataTypes.STRING,
        duree_minutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "Creneaux",
        freezeTableName: true,
    }
);

export default Creneau;
