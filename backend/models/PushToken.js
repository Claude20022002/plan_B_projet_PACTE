import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Jeton Expo d'un appareil (notifications push de l'application mobile). */
const PushToken = sequelize.define(
    "PushToken",
    {
        id_push_token: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        token: { type: DataTypes.STRING(255), allowNull: false, unique: true },
        plateforme: { type: DataTypes.ENUM("android", "ios"), allowNull: false, defaultValue: "android" },
    },
    { tableName: "PushTokens", freezeTableName: true }
);

export default PushToken;
