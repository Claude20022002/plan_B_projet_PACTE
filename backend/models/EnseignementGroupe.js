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
        // Composante que la maquette fait suivre au groupe, quand elle diffère de celle de
        // l'enseignement (mutualisation entre modules différents) ; NULL sinon
        id_composante_origine: DataTypes.INTEGER,
    },
    {
        tableName: "EnseignementGroupes",
        freezeTableName: true,
    }
);

export default EnseignementGroupe;
