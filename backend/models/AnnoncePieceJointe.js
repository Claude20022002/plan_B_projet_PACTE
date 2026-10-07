import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Pièce jointe d'une annonce (PDF ou image, 5 Mo au plus), lue seulement au téléchargement. */
const AnnoncePieceJointe = sequelize.define(
    "AnnoncePieceJointe",
    {
        id_annonce: { type: DataTypes.INTEGER, primaryKey: true },
        nom: { type: DataTypes.STRING(200), allowNull: false },
        type_mime: { type: DataTypes.STRING(100), allowNull: false },
        taille: { type: DataTypes.INTEGER, allowNull: false },
        contenu: { type: DataTypes.BLOB("medium"), allowNull: false },
    },
    { tableName: "AnnoncesPiecesJointes", freezeTableName: true }
);

export default AnnoncePieceJointe;
