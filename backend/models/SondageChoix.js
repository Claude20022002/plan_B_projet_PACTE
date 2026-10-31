import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Choix d'un sondage et son compteur : une réponse l'incrémente, sans garder qui l'a donnée (lot EC-9). */
const SondageChoix = sequelize.define(
    "SondageChoix",
    {
        id_choix: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_sondage: { type: DataTypes.INTEGER, allowNull: false },
        rang: { type: DataTypes.TINYINT, allowNull: false },
        libelle: { type: DataTypes.STRING(100), allowNull: false },
        reponses: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    },
    { tableName: "SondagesChoix", freezeTableName: true, timestamps: false }
);

export default SondageChoix;
