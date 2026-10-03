import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Cours = sequelize.define(
    "Cours",
    {
        id_cours: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        code_cours: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
        },
        nom_cours: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        niveau: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        volume_horaire: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        type_cours: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        semestre: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        coefficient: {
            type: DataTypes.DECIMAL(3, 2),
            defaultValue: 1.0,
        },
        id_filiere: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
        ects: {
            type: DataTypes.DECIMAL(4, 1),
            get() {
                const valeur = this.getDataValue("ects");
                return valeur === null || valeur === undefined ? valeur : Number(valeur);
            },
        },
        // Enseignant responsable du module (coordonne ses composantes)
        id_responsable: DataTypes.INTEGER,
    },
    {
        tableName: "Cours",
        freezeTableName: true,
    }
);

export default Cours;
