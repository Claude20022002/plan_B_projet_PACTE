import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const ConflitAffectation = sequelize.define(
    "ConflitAffectation",
    {
        id_conflit_affectation: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        id_conflit: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
        id_affectation: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
    },
    {
        tableName: "ConflitAffectations",
        freezeTableName: true,
    }
);

export default ConflitAffectation;
