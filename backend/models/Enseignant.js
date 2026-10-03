import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { STATUTS_ENSEIGNANT } from "../config/referentiel.js";

const Enseignant = sequelize.define(
    "Enseignant",
    {
        id_user: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            // Les relations sont gérées via les associations dans models/index.js
        },
        specialite: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        departement: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        grade: DataTypes.STRING,
        bureau: DataTypes.STRING,
        statut: {
            type: DataTypes.ENUM(...STATUTS_ENSEIGNANT),
            allowNull: false,
            defaultValue: "permanent",
        },
        // Heures dues sur l'année universitaire (permanents) ; vide pour un vacataire payé à l'heure
        service_annuel_heures: DataTypes.INTEGER,
        max_heures_semaine: DataTypes.INTEGER,
        id_campus_prefere: DataTypes.INTEGER,
        // Entreprise d'origine d'un vacataire venu de l'industrie
        entreprise: DataTypes.STRING,
    },
    {
        tableName: "Enseignants",
        freezeTableName: true,
    }
);

export default Enseignant;
