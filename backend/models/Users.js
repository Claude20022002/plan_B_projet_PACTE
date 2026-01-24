import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Users = sequelize.define(
    "Users",
    {
        id_user: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nom: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        prenom: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM("admin", "enseignant", "etudiant"),
            defaultValue: "etudiant",
        },
        telephone: DataTypes.STRING,
        actif: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        password_hash: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        avatar_url: DataTypes.TEXT, // Utiliser TEXT au lieu de STRING pour permettre les images base64 longues
    },
    {
        tableName: "Users",
        freezeTableName: true,
    }
);

export default Users;
