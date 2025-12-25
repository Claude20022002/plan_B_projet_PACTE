import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Notification = sequelize.define(
    "Notification",
    {
        id_notification: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        titre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        type_notification: {
            type: DataTypes.ENUM("info", "warning", "error", "success"),
            defaultValue: "info",
        },
        lue: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        date_envoi: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
    },
    {
        tableName: "Notifications",
        freezeTableName: true,
    }
);

export default Notification;
