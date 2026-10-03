import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Modules qu'un enseignant peut prendre : filtre les propositions de service et de remplacement. */
const CompetenceEnseignant = sequelize.define(
    "CompetenceEnseignant",
    {
        id_user: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        id_cours: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
    },
    {
        tableName: "CompetencesEnseignants",
        freezeTableName: true,
    }
);

export default CompetenceEnseignant;
