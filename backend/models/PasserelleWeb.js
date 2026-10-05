import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Code à usage unique de l'application mobile vers les sites web (empreinte seulement). */
const PasserelleWeb = sequelize.define(
    "PasserelleWeb",
    {
        id_passerelle: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code_hash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        suite: { type: DataTypes.STRING(300), allowNull: false },
        expire_le: { type: DataTypes.DATE, allowNull: false },
        utilise_le: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "PasserellesWeb", freezeTableName: true }
);

export default PasserelleWeb;
