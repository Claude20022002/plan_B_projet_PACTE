import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Plan = sequelize.define(
    "Plan",
    {
        id_plan: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        code: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        price_monthly: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        max_users: DataTypes.INTEGER,
        max_students: DataTypes.INTEGER,
        max_teachers: DataTypes.INTEGER,
        max_rooms: DataTypes.INTEGER,
        features: DataTypes.JSON,
    },
    {
        tableName: "Plans",
        freezeTableName: true,
    }
);

export default Plan;
