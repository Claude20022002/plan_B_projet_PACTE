import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Section de l'espace de cours d'une classe (module, groupe) : « Général », « Semaine 1 », « TP »… */
const SectionCours = sequelize.define(
    "SectionCours",
    {
        id_section: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_cours: { type: DataTypes.INTEGER, allowNull: false },
        id_groupe: { type: DataTypes.INTEGER, allowNull: false },
        titre: { type: DataTypes.STRING(120), allowNull: false },
        ordre: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        visible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        id_user_auteur: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "SectionsCours", freezeTableName: true }
);

export default SectionCours;
