import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Groupes qui suivent un enseignement (plusieurs = enseignement mutualisé). */
const EnseignementGroupe = sequelize.define(
    "EnseignementGroupe",
    {
        id_enseignement: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        id_groupe: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
    },
    {
        tableName: "EnseignementGroupes",
        freezeTableName: true,
    }
);

export default EnseignementGroupe;
