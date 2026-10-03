import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { TYPES_EVENEMENT, PORTEES_EVENEMENT } from "../config/referentiel.js";

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
            type: DataTypes.ENUM(...TYPES_EVENEMENT),
            defaultValue: "autre",
        },
        bloque_affectations: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: "Si true, aucune affectation ne peut être créée pendant cet événement",
        },
        // Qui est concerné : tout l'établissement, un campus, une filière, un niveau d'une filière ou un groupe
        portee: {
            type: DataTypes.ENUM(...PORTEES_EVENEMENT),
            allowNull: false,
            defaultValue: "etablissement",
        },
        // id du campus, de la filière ou du groupe selon la portée (filière pour la portée « niveau »)
        id_cible: DataTypes.INTEGER,
        niveau: DataTypes.STRING,
        // Plage horaire facultative (null = journées entières), ex. activités d'intégration l'après-midi
        heure_debut: DataTypes.TIME,
        heure_fin: DataTypes.TIME,
        // Faux pour une fête religieuse dont la date reste à confirmer (observation du croissant)
        date_confirmee: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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
