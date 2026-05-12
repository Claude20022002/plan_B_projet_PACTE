import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const AuthSession = sequelize.define(
    "AuthSession",
    {
        id_auth_session: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        session_id: {
            type: DataTypes.STRING(64),
            allowNull: false,
        },
        family_id: {
            type: DataTypes.STRING(64),
            allowNull: false,
        },
        refresh_token_hash: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true,
        },
        user_agent: DataTypes.STRING(500),
        ip_address: DataTypes.STRING(45),
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        last_used_at: DataTypes.DATE,
        revoked_at: DataTypes.DATE,
        revoked_reason: DataTypes.STRING(100),
        replaced_by_token_id: DataTypes.INTEGER,
    },
    {
        tableName: "AuthSessions",
        freezeTableName: true,
        indexes: [
            { fields: ["id_user"] },
            { fields: ["session_id"] },
            { fields: ["family_id"] },
            { fields: ["refresh_token_hash"] },
        ],
    }
);

export default AuthSession;
