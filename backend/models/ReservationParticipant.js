import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { ROLES_PARTICIPANT } from "../config/referentiel.js";

/** Personne ou groupe concerné par une réservation (jury, intervenant, groupe d'étudiants). */
const ReservationParticipant = sequelize.define(
    "ReservationParticipant",
    {
        id_participant: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_reservation: { type: DataTypes.INTEGER, allowNull: false },
        id_user: DataTypes.INTEGER,
        id_groupe: DataTypes.INTEGER,
        role: { type: DataTypes.ENUM(...ROLES_PARTICIPANT), allowNull: false, defaultValue: "participant" },
    },
    { tableName: "ReservationParticipants", freezeTableName: true }
);

export default ReservationParticipant;
