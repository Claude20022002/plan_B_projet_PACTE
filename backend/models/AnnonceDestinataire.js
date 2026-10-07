import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Destinataire d'une annonce, figé à l'envoi ; lu_le sert d'accusé de lecture. */
const AnnonceDestinataire = sequelize.define(
    "AnnonceDestinataire",
    {
        id_annonce: { type: DataTypes.INTEGER, primaryKey: true },
        id_user: { type: DataTypes.INTEGER, primaryKey: true },
        lu_le: DataTypes.DATE,
    },
    { tableName: "AnnoncesDestinataires", freezeTableName: true, timestamps: false }
);

export default AnnonceDestinataire;
