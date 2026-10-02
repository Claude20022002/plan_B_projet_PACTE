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
        // Le hash ne sort jamais par défaut, y compris via les `include` d'autres modèles.
        // Seul le login le charge explicitement : Users.scope("withPassword").
        defaultScope: {
            attributes: { exclude: ["password_hash"] },
        },
        scopes: {
            withPassword: {
                attributes: { include: ["password_hash"] },
            },
        },
    }
);

// Filet de sécurité : même une instance chargée avec le hash ne le sérialise jamais en JSON.
Users.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
};

export default Users;
