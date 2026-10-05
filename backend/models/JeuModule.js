import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/** Jeu proposé dans un module (code du catalogue shared/jeux/catalogue.js). */
const JeuModule = sequelize.define(
    "JeuModule",
    {
        id_jeu_module: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        code_jeu: { type: DataTypes.STRING(40), allowNull: false },
        id_cours: { type: DataTypes.INTEGER, allowNull: false },
        id_user_auteur: { type: DataTypes.INTEGER, allowNull: true },
    },
    { tableName: "JeuxModules", freezeTableName: true }
);

export default JeuModule;
