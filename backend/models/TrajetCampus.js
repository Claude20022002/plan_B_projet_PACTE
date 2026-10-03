import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Temps minimal entre deux séances consécutives sur deux campus différents.
 * Une seule ligne par paire, rangée avec id_campus_a < id_campus_b.
 */
const TrajetCampus = sequelize.define(
    "TrajetCampus",
    {
        id_trajet: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        id_campus_a: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        id_campus_b: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        minutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "TrajetsCampus",
        freezeTableName: true,
        indexes: [{ unique: true, fields: ["id_campus_a", "id_campus_b"] }],
    }
);

export default TrajetCampus;
