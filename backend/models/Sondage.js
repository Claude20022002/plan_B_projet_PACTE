import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Sondage d'un enseignant à une classe (module, groupe) : une question, ses choix (lot EC-9). */
const Sondage = sequelize.define(
    "Sondage",
    {
        id_sondage: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_cours: { type: DataTypes.INTEGER, allowNull: false },
        id_groupe: { type: DataTypes.INTEGER, allowNull: false },
        question: { type: DataTypes.STRING(300), allowNull: false },
        // Dernier jour de réponse, inclus (facultatif) ; clos_le : clôture par l'enseignant
        ferme_le: { type: DataTypes.DATEONLY, allowNull: true },
        clos_le: { type: DataTypes.DATE, allowNull: true },
        id_user_auteur: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "Sondages", freezeTableName: true }
);

export default Sondage;
