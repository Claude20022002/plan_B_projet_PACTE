import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const DemandeReport = sequelize.define(
    "DemandeReport",
    {
        id_demande: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        date_demande: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        motif: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        nouvelle_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        // en_attente → (administration) a_confirmer → (enseignant) approuve ; refuse par l'administration
        statut_demande: {
            type: DataTypes.ENUM("en_attente", "a_confirmer", "approuve", "refuse"),
            defaultValue: "en_attente",
        },
        id_user_enseignant: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
        // Créneau visé ; sans lui, le créneau de même rang le jour de la nouvelle date
        id_creneau_nouveau: DataTypes.INTEGER,
        // Salle retenue avec le créneau (le serveur la choisit, l'administration peut la changer)
        id_salle_nouvelle: DataTypes.INTEGER,
        // Raison donnée par l'administration quand elle refuse
        motif_decision: DataTypes.TEXT,
        // Administrateur qui a validé la proposition, et justification s'il a forcé une règle
        id_user_decision: DataTypes.INTEGER,
        // La séance au moment de la demande (M-6) : la date « d'origine » qu'affichent les écrans
        date_seance_origine: DataTypes.DATEONLY,
        id_creneau_origine: DataTypes.INTEGER,
        justification_forcage: DataTypes.TEXT,
        id_affectation: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
    },
    {
        tableName: "DemandeReports",
        freezeTableName: true,
    }
);

export default DemandeReport;
