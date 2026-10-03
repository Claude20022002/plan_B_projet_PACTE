import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Filiere = sequelize.define(
    "Filiere",
    {
        id_filiere: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        code_filiere: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        nom_filiere: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: DataTypes.TEXT,
    },
    {
        tableName: "Filiere",
        freezeTableName: true,
    }
);

export default Filiere;
