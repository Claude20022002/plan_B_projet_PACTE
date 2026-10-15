import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Support d'une section : un document de StudyLib (référence seulement : Planner ne garde aucun
 * fichier) ou un lien. Voir docs/plans/espace-de-cours.md, § 3.
 */
const SupportCours = sequelize.define(
    "SupportCours",
    {
        id_support: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_section: { type: DataTypes.INTEGER, allowNull: false },
        type: { type: DataTypes.STRING(10), allowNull: false, validate: { isIn: [["document", "lien"]] } },
        titre: { type: DataTypes.STRING(200), allowNull: false },
        id_document: { type: DataTypes.CHAR(36), allowNull: true },
        url: { type: DataTypes.STRING(2048), allowNull: true },
        type_mime: { type: DataTypes.STRING(120), allowNull: true },
        taille: { type: DataTypes.INTEGER, allowNull: true },
        // Document aussi publié dans la Bibliothèque (épinglé depuis elle, ou publié depuis la classe)
        dans_bibliotheque: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        ordre: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        visible: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        id_user_auteur: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "SupportsCours", freezeTableName: true }
);

export default SupportCours;
