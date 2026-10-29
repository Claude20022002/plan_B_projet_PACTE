import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { TYPES_GROUPE, normaliserAnnee as normaliser } from "../config/referentiel.js";

const Groupe = sequelize.define(
    "Groupe",
    {
        id_groupe: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        nom_groupe: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        niveau: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        effectif: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        annee_scolaire: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        // Année universitaire du groupe (lot ME-18), tenue à jour depuis annee_scolaire par le crochet ci-dessous
        id_annee: DataTypes.INTEGER,
        id_filiere: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Les relations sont gérées via les associations dans models/index.js
        },
        // Promotion ⊃ groupes de TD ⊃ demi-groupes de TP
        type_groupe: {
            type: DataTypes.ENUM(...TYPES_GROUPE),
            allowNull: false,
            defaultValue: "td",
        },
        id_groupe_parent: DataTypes.INTEGER,
        // Année d'études (1 à 5) : « 4A | IIIA (S7) »
        annee: DataTypes.INTEGER,
    },
    {
        tableName: "Groupes",
        freezeTableName: true,
        hooks: {
            // annee_scolaire donné ou changé sans id_annee explicite : l'année se retrouve par son libellé
            // (création par le site, l'import, le jeu de démonstration ou les tests, sans changer d'appelant)
            // Les années se lisent sur la connexion du groupe (groupe.sequelize), donc dans la base de son
            // école : un import de AnneeUniversitaire lirait toujours celle de config/db.js (essai de ME-3a)
            beforeSave: async (groupe, { transaction } = {}) => {
                if (!groupe.changed("annee_scolaire") || groupe.changed("id_annee")) return;
                const libelle = normaliser(groupe.annee_scolaire);
                const annees = await groupe.sequelize.models.AnneeUniversitaire.findAll({ attributes: ["id_annee", "libelle"], transaction });
                groupe.id_annee = annees.find((a) => normaliser(a.libelle) === libelle)?.id_annee ?? null;
            },
        },
    }
);

/**
 * Crochet afterSave de AnneeUniversitaire, posé par definitions.js : une année créée ou renommée après
 * ses groupes (ceux de l'année suivante saisis avant de la déclarer au calendrier) ; les groupes restés
 * sans année dont le texte la désigne s'y rattachent. Les groupes se lisent sur la connexion de l'année.
 */
export const rattacherGroupesSansAnnee = async (annee, { transaction } = {}) => {
    if (!annee.changed("libelle")) return;
    const Groupes = annee.sequelize.models.Groupe;
    const libelle = normaliser(annee.libelle);
    const orphelins = (await Groupes.findAll({ where: { id_annee: null }, attributes: ["id_groupe", "annee_scolaire"], transaction }))
        .filter((g) => normaliser(g.annee_scolaire) === libelle)
        .map((g) => g.id_groupe);
    if (orphelins.length) await Groupes.update({ id_annee: annee.id_annee }, { where: { id_groupe: orphelins }, transaction });
};

export default Groupe;
