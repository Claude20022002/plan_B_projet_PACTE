import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

/**
 * Enseignant responsable d'une filière : il prépare la maquette, les groupes et les services
 * de sa filière (le compte garde le rôle « enseignant »).
 */
const ResponsableFiliere = sequelize.define(
    "ResponsableFiliere",
    {
        id_user: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        id_filiere: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
    },
    {
        tableName: "ResponsablesFilieres",
        freezeTableName: true,
    }
);

export default ResponsableFiliere;
