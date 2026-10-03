import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { TYPES_COMPOSANTE, NIVEAUX_GROUPE, MODALITES } from "../config/referentiel.js";

/**
 * Partie d'un module : son CM, ses TD, ses TP ou son projet, avec son volume,
 * le groupe qui la suit, la salle dont elle a besoin et son rythme dans le semestre.
 * À HESTIM, une séance occupe en général deux créneaux consécutifs (une demi-journée).
 */
const CoursComposante = sequelize.define(
    "CoursComposante",
    {
        id_composante: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        id_cours: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM(...TYPES_COMPOSANTE),
            allowNull: false,
        },
        volume_heures: {
            type: DataTypes.DECIMAL(5, 1),
            allowNull: false,
            get() {
                const valeur = this.getDataValue("volume_heures");
                return valeur === null || valeur === undefined ? valeur : Number(valeur);
            },
        },
        type_salle_requis: DataTypes.STRING,
        equipements_requis: {
            type: DataTypes.JSON,
            defaultValue: [],
        },
        niveau_groupe: {
            type: DataTypes.ENUM(...NIVEAUX_GROUPE),
            allowNull: false,
            defaultValue: "promotion",
        },
        creneaux_par_seance: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 2,
        },
        modalite: {
            type: DataTypes.ENUM(...MODALITES),
            allowNull: false,
            defaultValue: "presentiel",
        },
        // Mention libre affichée dans l'emploi du temps (ex. « Blended Coursera »)
        mention: DataTypes.STRING,
        // Rythme : semaines du semestre (1 = première semaine de cours) et séances par semaine
        semaine_debut: DataTypes.INTEGER,
        semaine_fin: DataTypes.INTEGER,
        seances_par_semaine: DataTypes.INTEGER,
    },
    {
        tableName: "CoursComposantes",
        freezeTableName: true,
        indexes: [{ unique: true, fields: ["id_cours", "type"] }],
    }
);

export default CoursComposante;
