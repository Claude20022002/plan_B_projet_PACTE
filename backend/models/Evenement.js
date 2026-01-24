import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Evenement = sequelize.define(
    "Evenement",
    {
        id_evenement: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        titre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: DataTypes.TEXT,
        date_debut: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        date_fin: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        type_evenement: {
            type: DataTypes.ENUM(
                "vacances",
                "examen",
                "ferie",
                "reunion",
                "formation",
                "autre"
            ),
            defaultValue: "autre",
        },
        bloque_affectations: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: "Si true, aucune affectation ne peut être créée pendant cet événement",
        },
        id_user_createur: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "Administrateur qui a créé l'événement",
        },
    },
    {
        tableName: "Evenements",
        freezeTableName: true,
        timestamps: true,
    }
);

export default Evenement;
