import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Ce qui sera réellement planifié : une composante suivie par un ou plusieurs groupes
 * pendant une période. Plusieurs groupes = mutualisation (un seul cours pour tous).
 * Les enseignants (avec co-enseignement) s'y rattachent en phase P3.
 */
const Enseignement = sequelize.define(
    "Enseignement",
    {
        id_enseignement: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        id_composante: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        id_periode: DataTypes.INTEGER,
        libelle: DataTypes.STRING,
        heures_prevues: {
            type: DataTypes.DECIMAL(5, 1),
            allowNull: false,
            get() {
                const valeur = this.getDataValue("heures_prevues");
                return valeur === null || valeur === undefined ? valeur : Number(valeur);
            },
        },
    },
    {
        tableName: "Enseignements",
        freezeTableName: true,
    }
);

export default Enseignement;
