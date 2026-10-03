import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Campus = sequelize.define(
    "Campus",
    {
        id_campus: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        code: {
            type: DataTypes.STRING(10),
            allowNull: false,
            unique: true,
        },
        nom: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        adresse: DataTypes.STRING(255),
        actif: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        tableName: "Campus",
        freezeTableName: true,
    }
);

export default Campus;
