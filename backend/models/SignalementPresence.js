import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Soupçon de fraude à l'appel : téléphone partagé entre deux étudiants, absent à une vérification
 * surprise, scan depuis un autre téléphone que celui du compte, ou depuis le téléphone d'un autre.
 */
const SignalementPresence = sequelize.define(
    "SignalementPresence",
    {
        id_signalement: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_affectation: { type: DataTypes.INTEGER, allowNull: false },
        id_user: { type: DataTypes.INTEGER, allowNull: false },
        motif: { type: DataTypes.ENUM("appareil_partage", "absent_verification", "autre_telephone", "telephone_d_un_autre"), allowNull: false },
        id_user_lie: { type: DataTypes.INTEGER, allowNull: true },
        id_user_auteur: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "SignalementsPresence", freezeTableName: true }
);

export default SignalementPresence;
