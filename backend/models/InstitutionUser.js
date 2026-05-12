import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const InstitutionUser = sequelize.define(
    "InstitutionUser",
    {
        id_institution_user: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        id_institution: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        id_user: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM("owner", "admin", "enseignant", "etudiant"),
            allowNull: false,
        },
        statut: {
            type: DataTypes.ENUM("active", "invited", "suspended"),
            defaultValue: "active",
        },
        permissions: DataTypes.JSON,
    },
    {
        tableName: "InstitutionUsers",
        freezeTableName: true,
        indexes: [
            { unique: true, fields: ["id_institution", "id_user"] },
            { fields: ["id_user"] },
            { fields: ["id_institution", "role"] },
        ],
    }
);

export default InstitutionUser;
