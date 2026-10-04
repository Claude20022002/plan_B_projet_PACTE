import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Épreuve d'examen d'un module, pour des groupes, sur une ou plusieurs salles (phase P5). */
const SessionExamen = sequelize.define(
    "SessionExamen",
    {
        id_session: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        titre: { type: DataTypes.STRING, allowNull: false },
        id_cours: { type: DataTypes.INTEGER, allowNull: false },
        id_periode: DataTypes.INTEGER,
        date: { type: DataTypes.DATEONLY, allowNull: false },
        heure_debut: { type: DataTypes.TIME, allowNull: false },
        heure_fin: { type: DataTypes.TIME, allowNull: false },
        statut: { type: DataTypes.ENUM("brouillon", "publiee", "annulee"), allowNull: false, defaultValue: "brouillon" },
        id_createur: { type: DataTypes.INTEGER, allowNull: false },
    },
    { tableName: "SessionsExamen", freezeTableName: true }
);

export default SessionExamen;
