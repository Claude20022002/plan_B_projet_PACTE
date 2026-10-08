import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Téléphone lié à un compte étudiant pour l'appel (empreinte de l'identifiant d'installation) : un compte = un téléphone. */
const AppareilEtudiant = sequelize.define(
    "AppareilEtudiant",
    {
        id_user: { type: DataTypes.INTEGER, primaryKey: true },
        appareil: { type: DataTypes.STRING(64), allowNull: false, unique: true },
        lie_le: { type: DataTypes.DATE, allowNull: false },
    },
    { tableName: "AppareilsEtudiants", freezeTableName: true }
);

export default AppareilEtudiant;
