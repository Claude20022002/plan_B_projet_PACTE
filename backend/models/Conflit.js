import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Conflit = sequelize.define(
    "Conflit",
    {
        id_conflit: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        type_conflit: {
            type: DataTypes.ENUM("salle", "enseignant", "groupe"),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        date_detection: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        resolu: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        date_resolution: DataTypes.DATE,
    },
    {
        tableName: "Conflits",
        freezeTableName: true,
    }
);

export default Conflit;
