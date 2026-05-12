import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Institution = sequelize.define(
    "Institution",
    {
        id_institution: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        slug: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        domaine_email: DataTypes.STRING,
        statut: {
            type: DataTypes.ENUM("trial", "active", "suspended", "archived"),
            defaultValue: "active",
        },
        timezone: {
            type: DataTypes.STRING,
            defaultValue: "Africa/Lagos",
        },
        pays: DataTypes.STRING,
        settings: DataTypes.JSON,
    },
    {
        tableName: "Institutions",
        freezeTableName: true,
    }
);

export default Institution;
