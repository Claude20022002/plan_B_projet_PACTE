import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Génération d'un quiz par l'IA (services/ia/quiz.js) : contexte, brouillon relu, coût. */
const GenerationQuiz = sequelize.define(
    "GenerationQuiz",
    {
        id_generation: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        id_cours: { type: DataTypes.INTEGER, allowNull: false },
        id_groupe: { type: DataTypes.INTEGER, allowNull: true },
        source: { type: DataTypes.STRING(20), allowNull: false },
        nom_source: { type: DataTypes.STRING(255), allowNull: true },
        plage: { type: DataTypes.STRING(100), allowNull: true },
        reglages: { type: DataTypes.JSON, allowNull: false },
        statut: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "en_cours" },
        erreur: { type: DataTypes.STRING(500), allowNull: true },
        support_texte: { type: DataTypes.TEXT("long"), allowNull: true },
        brouillon: { type: DataTypes.JSON, allowNull: true },
        modele: { type: DataTypes.STRING(100), allowNull: true },
        jetons_entree: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        jetons_sortie: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        duree_ms: { type: DataTypes.INTEGER, allowNull: true },
        id_quiz_classquiz: { type: DataTypes.STRING(36), allowNull: true },
    },
    { tableName: "GenerationsQuiz", freezeTableName: true }
);

export default GenerationQuiz;
