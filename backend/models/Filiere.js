import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { REGIMES, ECOLES, CYCLES } from "../config/referentiel.js";

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
        ecole: {
            type: DataTypes.ENUM(...ECOLES),
            allowNull: false,
            defaultValue: "engineering",
        },
        cycle: DataTypes.ENUM(...CYCLES),
        // « cycle Ingénieur d'Etat » : sert à écrire « 2ème année du cycle Ingénieur d'Etat en … »
        intitule_cycle: DataTypes.STRING,
        // Année d'études où commence le cycle (3 pour le cycle ingénieur après deux ans de prépa)
        premiere_annee_cycle: DataTypes.INTEGER,
        id_campus_prefere: DataTypes.INTEGER,
        // École partenaire d'un double diplôme (ESTIA, INSA Rennes…)
        partenaire: DataTypes.STRING,
        // Dernière année suivie à HESTIM (les années suivantes se font chez le partenaire)
        annees_a_hestim: DataTypes.INTEGER,
    },
    {
        tableName: "Filiere",
        freezeTableName: true,
    }
);

export default Filiere;
