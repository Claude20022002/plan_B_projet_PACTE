import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { REGIMES } from "../config/referentiel.js";

const Filiere = sequelize.define(
    "Filiere",
    {
        id_filiere: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        code_filiere: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        nom_filiere: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description: DataTypes.TEXT,
        // Temps plein, horaires aménagés ou executive : détermine la grille horaire utilisée
        regime: {
            type: DataTypes.ENUM(...REGIMES),
            allowNull: false,
            defaultValue: "initiale",
        },
    },
    {
        tableName: "Filiere",
        freezeTableName: true,
    }
);

export default Filiere;
