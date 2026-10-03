import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Salle = sequelize.define(
    "Salle",
    {
        id_salle: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nom_salle: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type_salle: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        capacite: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        batiment: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        etage: DataTypes.INTEGER,
        equipements: DataTypes.TEXT,
        disponible: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "Salles",
        freezeTableName: true,
    }
);

export default Salle;
