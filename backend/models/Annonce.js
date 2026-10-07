import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { PORTEES_EVENEMENT } from "../config/referentiel.js";

/** Annonce ciblée (phase R1) : même portée que les événements, public étudiants, enseignants ou les deux. */
const Annonce = sequelize.define(
    "Annonce",
    {
        id_annonce: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        titre: { type: DataTypes.STRING(200), allowNull: false },
        corps: { type: DataTypes.TEXT, allowNull: false },
        portee: { type: DataTypes.ENUM(...PORTEES_EVENEMENT), allowNull: false, defaultValue: "etablissement" },
        // id du campus, de la filière ou du groupe selon la portée (filière pour la portée « niveau »)
        id_cible: DataTypes.INTEGER,
        niveau: DataTypes.STRING(50),
        public: { type: DataTypes.ENUM("etudiants", "enseignants", "tous"), allowNull: false, defaultValue: "etudiants" },
        envoyer_email: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        id_user_auteur: { type: DataTypes.INTEGER, allowNull: false },
        relancee_le: DataTypes.DATE,
    },
    { tableName: "Annonces", freezeTableName: true }
);

export default Annonce;
