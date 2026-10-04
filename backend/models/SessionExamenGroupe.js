import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const SessionExamenGroupe = sequelize.define(
    "SessionExamenGroupe",
    {
        id_session: { type: DataTypes.INTEGER, primaryKey: true },
        id_groupe: { type: DataTypes.INTEGER, primaryKey: true },
    },
    { tableName: "SessionExamenGroupes", freezeTableName: true }
);

export default SessionExamenGroupe;
