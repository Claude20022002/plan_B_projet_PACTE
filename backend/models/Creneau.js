import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { JOURS_SEMAINE, REGIMES, VARIANTES_GRILLE } from "../config/referentiel.js";

/**
 * Créneau d'une grille horaire. Une séance est planifiée sur (jour, rang) :
 * la variante « ramadan » d'une grille porte les mêmes rangs à des horaires réduits,
 * si bien qu'une semaine type reste valable pendant le Ramadan sans recalcul.
 */
const Creneau = sequelize.define(
    "Creneau",
    {
        id_creneau: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        jour_semaine: {
            type: DataTypes.ENUM(...JOURS_SEMAINE),
            allowNull: false,
        },
        heure_debut: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        heure_fin: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        periode: DataTypes.STRING,
        duree_minutes: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        regime: {
            type: DataTypes.ENUM(...REGIMES),
            allowNull: false,
            defaultValue: "initiale",
        },
        variante: {
            type: DataTypes.ENUM(...VARIANTES_GRILLE),
            allowNull: false,
            defaultValue: "normale",
        },
        // Position dans la journée (1 = premier créneau), recalculée à chaque modification de la grille
        rang: DataTypes.INTEGER,
    },
    {
        tableName: "Creneaux",
        freezeTableName: true,
    }
);

export default Creneau;
