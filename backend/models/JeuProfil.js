import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Personnage choisi par un joueur (shared/jeux/avatars.js) ; une ligne au plus par utilisateur. */
const JeuProfil = sequelize.define(
    "JeuProfil",
    {
        id_user: { type: DataTypes.INTEGER, primaryKey: true },
        avatar: { type: DataTypes.STRING(20), allowNull: false },
    },
    { tableName: "JeuxProfils", freezeTableName: true }
);

export default JeuProfil;
