import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const PlanningSnapshot = sequelize.define(
    "PlanningSnapshot",
    {
        id_snapshot: {
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
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        score_total: DataTypes.INTEGER,
        score_detail: DataTypes.JSON,
        nb_affectations: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        nb_conflits: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        id_generation_session: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        id_user_admin: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
    },
    {
        tableName: "PlanningSnapshots",
        freezeTableName: true,
    }
);

export default PlanningSnapshot;
