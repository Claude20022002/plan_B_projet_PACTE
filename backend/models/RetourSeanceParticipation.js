import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Trace qu'un étudiant a déjà répondu à une séance, sans lien avec sa réponse. */
const RetourSeanceParticipation = sequelize.define(
    "RetourSeanceParticipation",
    {
        id_affectation: { type: DataTypes.INTEGER, primaryKey: true },
        id_user: { type: DataTypes.INTEGER, primaryKey: true },
    },
    { tableName: "RetoursSeanceParticipations", freezeTableName: true, timestamps: false }
);

export default RetourSeanceParticipation;
