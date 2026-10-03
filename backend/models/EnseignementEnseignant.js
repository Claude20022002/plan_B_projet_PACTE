import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { ROLES_SERVICE, STATUTS_SERVICE } from "../config/referentiel.js";

/**
 * Service d'enseignement : qui assure un enseignement. Plusieurs lignes = co-enseignement
 * (« Mme HAIDRAR / Mme BOUBEKRAOUI ») : tous les enseignants sont bloqués pendant la séance.
 * Le responsable de filière propose, l'enseignant accepte ou refuse.
 */
const EnseignementEnseignant = sequelize.define(
    "EnseignementEnseignant",
    {
        id_enseignement: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        id_user: {
            type: DataTypes.INTEGER,
            primaryKey: true,
        },
        role: {
            type: DataTypes.ENUM(...ROLES_SERVICE),
            allowNull: false,
            defaultValue: "principal",
        },
        statut_service: {
            type: DataTypes.ENUM(...STATUTS_SERVICE),
            allowNull: false,
            defaultValue: "propose",
        },
        // Heures comptées dans la charge de l'enseignant (vide = volume prévu de l'enseignement)
        heures: {
            type: DataTypes.DECIMAL(5, 1),
            get() {
                const valeur = this.getDataValue("heures");
                return valeur === null || valeur === undefined ? valeur : Number(valeur);
            },
        },
        motif_refus: DataTypes.STRING,
    },
    {
        tableName: "EnseignementEnseignants",
        freezeTableName: true,
    }
);

export default EnseignementEnseignant;
