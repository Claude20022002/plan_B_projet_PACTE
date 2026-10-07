import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Énoncé d'un devoir (id_user nul) ou copie rendue par un étudiant ; lu seulement au téléchargement. */
const FichierDevoir = sequelize.define(
    "FichierDevoir",
    {
        id_fichier: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_devoir: { type: DataTypes.INTEGER, allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: true },
        nom: { type: DataTypes.STRING(200), allowNull: false },
        type_mime: { type: DataTypes.STRING(100), allowNull: false },
        taille: { type: DataTypes.INTEGER, allowNull: false },
        contenu: { type: DataTypes.BLOB("medium"), allowNull: false },
    },
    { tableName: "FichiersDevoirs", freezeTableName: true }
);

export default FichierDevoir;
