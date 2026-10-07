import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Soupçon de fraude à l'appel : téléphone partagé entre deux étudiants, ou absent à une vérification surprise. */
const SignalementPresence = sequelize.define(
    "SignalementPresence",
    {
        id_signalement: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_affectation: { type: DataTypes.INTEGER, allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        motif: { type: DataTypes.ENUM("appareil_partage", "absent_verification"), allowNull: false },
        id_user_lie: { type: DataTypes.INTEGER, allowNull: true },
        id_user_auteur: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "SignalementsPresence", freezeTableName: true }
);

export default SignalementPresence;
