import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

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
