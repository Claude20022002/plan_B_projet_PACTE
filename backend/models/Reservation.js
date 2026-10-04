import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { STATUTS_RESERVATION, TYPES_RESERVATION } from "../config/referentiel.js";

/**
 * Réservation d'une salle hors cours (phase P5) : rattrapage, réunion, soutenance, examen,
 * événement, club. Bloque la salle et ses participants comme une séance une fois validée.
 */
const Reservation = sequelize.define(
    "Reservation",
    {
        id_reservation: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        type: { type: DataTypes.ENUM(...TYPES_RESERVATION), allowNull: false },
        titre: { type: DataTypes.STRING, allowNull: false },
        description: DataTypes.TEXT,
        id_salle: DataTypes.INTEGER,
        date: { type: DataTypes.DATEONLY, allowNull: false },
        heure_debut: { type: DataTypes.TIME, allowNull: false },
        heure_fin: { type: DataTypes.TIME, allowNull: false },
        statut: { type: DataTypes.ENUM(...STATUTS_RESERVATION), allowNull: false, defaultValue: "demandee" },
        motif_refus: DataTypes.TEXT,
        id_affectation_origine: DataTypes.INTEGER,
        id_affectation_creee: DataTypes.INTEGER,
        id_demandeur: { type: DataTypes.INTEGER, allowNull: false },
        id_valideur: DataTypes.INTEGER,
        date_validation: DataTypes.DATE,
        force: { type: DataTypes.BOOLEAN, defaultValue: false },
        justification_force: DataTypes.TEXT,
    },
    { tableName: "Reservations", freezeTableName: true }
);

export default Reservation;
