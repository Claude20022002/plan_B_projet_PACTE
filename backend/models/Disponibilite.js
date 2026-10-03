import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { PREFERENCES_CRENEAU } from "../config/referentiel.js";

const Disponibilite = sequelize.define(
    "Disponibilite",
    {
        id_disponibilite: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        disponible: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        raison_indisponibilite: DataTypes.TEXT,
        // Vœu non bloquant sur ce créneau (préféré / à éviter), pris en compte par la génération
        preference: {
            type: DataTypes.ENUM(...PREFERENCES_CRENEAU),
            allowNull: false,
            defaultValue: "neutre",
        },
        date_debut: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        date_fin: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        id_user_enseignant: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
        id_creneau: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
    },
    {
        tableName: "Disponibilites",
        freezeTableName: true,
    }
);

export default Disponibilite;
