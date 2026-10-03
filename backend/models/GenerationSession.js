import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const GenerationSession = sequelize.define(
    "GenerationSession",
    {
        id_generation_session: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        label: DataTypes.STRING,
        date_debut: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        date_fin: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("pending", "running", "completed", "failed", "cancelled"),
            defaultValue: "pending",
        },
        progress: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        last_message: DataTypes.STRING,
        score_total: DataTypes.INTEGER,
        score_detail: DataTypes.JSON,
        config: DataTypes.JSON,
        nb_assignees: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        nb_conflits: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        nb_non_placees: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        duration_ms: DataTypes.INTEGER,
        id_user_admin: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "GenerationSessions",
        freezeTableName: true,
    }
);

export default GenerationSession;
