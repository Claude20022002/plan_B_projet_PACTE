import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { TYPES_SALLE, RESERVABLE_PAR } from "../config/referentiel.js";

const Salle = sequelize.define(
    "Salle",
    {
        id_salle: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nom_salle: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type_salle: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: { isIn: [TYPES_SALLE] },
        },
        capacite: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        // Places utilisables en examen (≈ moitié de la capacité si non renseigné)
        capacite_examen: DataTypes.INTEGER,
        id_campus: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        etage: DataTypes.INTEGER,
        // Liste de libellés : ["Vidéoprojecteur", "30 postes", "AutoCAD"]
        equipements: {
            type: DataTypes.JSON,
            defaultValue: [],
        },
        reservable_par: {
            type: DataTypes.ENUM(...RESERVABLE_PAR),
            defaultValue: "admin",
        },
        disponible: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        // Compatibilité lecture seule : ancien champ libre, remplacé par le campus
        batiment: {
            type: DataTypes.VIRTUAL,
            get() {
                return this.get("campus")?.nom ?? null;
            },
        },
    },
    {
        tableName: "Salles",
        freezeTableName: true,
    }
);

export default Salle;
