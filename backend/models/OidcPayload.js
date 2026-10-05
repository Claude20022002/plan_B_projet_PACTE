import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Objet stocké par le fournisseur OpenID Connect (session, code, jeton…), voir services/oidc/adapter.js. */
const OidcPayload = sequelize.define(
    "OidcPayload",
    {
        id: { type: DataTypes.STRING(255), allowNull: false, primaryKey: true },
        model: { type: DataTypes.STRING(40), allowNull: false, primaryKey: true },
        payload: { type: DataTypes.JSON, allowNull: false },
        grant_id: { type: DataTypes.STRING(255), allowNull: true },
        user_code: { type: DataTypes.STRING(255), allowNull: true },
        uid: { type: DataTypes.STRING(255), allowNull: true },
        expires_at: { type: DataTypes.DATE, allowNull: true },
        consumed_at: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "OidcPayloads", freezeTableName: true }
);

export default OidcPayload;
