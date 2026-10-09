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
        // Compte créé par l'administration : mot de passe à choisir à la première connexion
        must_change_password: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        avatar_url: DataTypes.TEXT, // Utiliser TEXT au lieu de STRING pour permettre les images base64 longues
        // Double authentification (services/mfa.js) : secret TOTP chiffré, état, dernier pas utilisé
        mfa_secret: { type: DataTypes.STRING(255), allowNull: true },
        mfa_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        mfa_dernier_pas: { type: DataTypes.BIGINT, allowNull: true },
    },
    {
        tableName: "Users",
        freezeTableName: true,
        // Le hash et le secret de double authentification ne sortent jamais par défaut, y compris
        // via les `include` d'autres modèles. Le login charge le hash (« withPassword »), la
        // vérification d'un code le secret (« withMfa »).
        defaultScope: {
            attributes: { exclude: ["password_hash", "mfa_secret", "mfa_dernier_pas"] },
        },
        scopes: {
            withPassword: {
                attributes: { include: ["password_hash"] },
            },
            withMfa: {
                attributes: { include: ["mfa_secret", "mfa_dernier_pas"] },
            },
        },
    }
);

// Filet de sécurité : même une instance chargée avec le hash ou le secret ne les sérialise jamais en JSON.
Users.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.mfa_secret;
    delete values.mfa_dernier_pas;
    return values;
};

export default Users;
