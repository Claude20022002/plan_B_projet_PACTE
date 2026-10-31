import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Identité et marque de l'école (D-21, lots ME-1 et ME-11) : une seule ligne (id = 1), réglée par
 * l'administration dans le panneau de configuration. Le logo n'est lu que par sa propre route.
 */
const ConfigurationEtablissement = sequelize.define(
    "ConfigurationEtablissement",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true },
        nom: { type: DataTypes.STRING(150), allowNull: false },
        nom_court: { type: DataTypes.STRING(30), allowNull: false },
        couleur_principale: { type: DataTypes.CHAR(7), allowNull: false },
        couleur_accent: { type: DataTypes.CHAR(7), allowNull: false },
        logo: { type: DataTypes.BLOB("medium"), allowNull: true },
        logo_type: { type: DataTypes.STRING(30), allowNull: true },
        logo_maj_le: { type: DataTypes.DATE, allowNull: true },
        expediteur_nom: { type: DataTypes.STRING(100), allowNull: true },
        adresse_reponse: { type: DataTypes.STRING(255), allowNull: true },
        modele_edt: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "planner" },
        // Sondages des enseignants à leurs classes (lot EC-9, migration 0059) : éteints par défaut
        sondages_actifs: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    {
        tableName: "ConfigurationEtablissement",
        freezeTableName: true,
        // Le logo (jusqu'à quelques centaines de Ko) ne voyage qu'avec sa route
        defaultScope: { attributes: { exclude: ["logo"] } },
        scopes: { avecLogo: { attributes: { include: ["logo"] } } },
    }
);

export default ConfigurationEtablissement;
