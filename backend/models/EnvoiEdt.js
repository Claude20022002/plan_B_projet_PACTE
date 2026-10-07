import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Dernier emploi du temps du mois envoyé à un groupe (R4) : les séances au moment de l'envoi. */
const EnvoiEdt = sequelize.define(
    "EnvoiEdt",
    {
        id_envoi: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        id_groupe: { type: DataTypes.INTEGER, allowNull: false },
        mois: { type: DataTypes.STRING(7), allowNull: false },
        seances: { type: DataTypes.JSON, allowNull: false },
        envoye_le: { type: DataTypes.DATE, allowNull: false },
        nb_destinataires: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        id_user_publication: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "EnvoisEdt", freezeTableName: true }
);

export default EnvoiEdt;
