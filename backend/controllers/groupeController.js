import { Affectation, Appartenir, Filiere, Groupe } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";
import { pick } from "../utils/validationHelper.js";
import { anneeDepuisNiveau } from "../config/referentiel.js";
import { construireArbre, verifierParent } from "../services/planning/groupes.js";

/**
 * Contrôleur pour les groupes, emboîtés : promotion ⊃ groupes de TD ⊃ demi-groupes de TP.
 */

const GROUPE_FIELDS = ["nom_groupe", "niveau", "effectif", "annee_scolaire", "id_filiere", "type_groupe", "id_groupe_parent", "annee"];

const INCLUDES = [
    { model: Filiere, as: "filiere" },
    { model: Groupe, as: "parent", attributes: ["id_groupe", "nom_groupe", "type_groupe"] },
];

const introuvable = (res, id) =>
    res.status(404).json({ message: "Groupe non trouvé", error: `Aucun groupe trouvé avec l'ID ${id}` });

const nomPris = async (nom, anneeScolaire, idExclu = null) => {
    const existant = await Groupe.findOne({ where: { nom_groupe: nom, annee_scolaire: anneeScolaire } });
    return existant && existant.id_groupe !== idExclu;
};

// 🔍 Récupérer tous les groupes (avec pagination)
export const getAllGroupes = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    const where = {};
    for (const filtre of ["id_filiere", "niveau", "annee_scolaire", "type_groupe", "annee"]) {
        if (req.query[filtre]) where[filtre] = req.query[filtre];
    }

    const { count, rows: groupes } = await Groupe.findAndCountAll({
        where,
        include: INCLUDES,
        limit,
        offset,
        order: [["nom_groupe", "ASC"]],
    });

    res.json(createPaginationResponse(groupes, count, page, limit));
});

// 🌳 Arbre des groupes : promotions → TD → TP (par filière et année scolaire facultatives)
export const getArbreGroupes = asyncHandler(async (req, res) => {
    const where = {};
    if (req.query.id_filiere) where.id_filiere = req.query.id_filiere;
    if (req.query.annee_scolaire) where.annee_scolaire = req.query.annee_scolaire;

    const groupes = await Groupe.findAll({ where, include: [{ model: Filiere, as: "filiere", attributes: ["id_filiere", "code_filiere", "nom_filiere"] }] });
    res.json(construireArbre(groupes));
});

// 🔍 Récupérer un groupe par ID
export const getGroupeById = asyncHandler(async (req, res) => {
    const groupe = await Groupe.findOne({ where: { id_groupe: req.params.id }, include: INCLUDES });
    if (!groupe) return introuvable(res, req.params.id);
    res.json(groupe);
});

// ➕ Créer un groupe
export const createGroupe = asyncHandler(async (req, res) => {
    const data = pick(req.body, GROUPE_FIELDS);
    data.type_groupe ??= "td";
    data.annee ??= anneeDepuisNiveau(data.niveau);

    if (await nomPris(data.nom_groupe, data.annee_scolaire)) {
        return res.status(409).json({
            message: "Groupe déjà existant",
            error: `Un groupe avec le nom "${data.nom_groupe}" existe déjà pour l'année ${data.annee_scolaire}`,
        });
    }
    const probleme = await verifierParent(data, data.id_groupe_parent);
    if (probleme) return res.status(400).json({ message: "Erreur de validation", error: probleme });

    const { id_groupe } = await Groupe.create(data);
    const groupe = await Groupe.findByPk(id_groupe, { include: INCLUDES });

    res.status(201).json({
        message: "Groupe créé avec succès",
        groupe,
    });
});

// ✏️ Mettre à jour un groupe
export const updateGroupe = asyncHandler(async (req, res) => {
    const groupe = await Groupe.findOne({ where: { id_groupe: req.params.id } });
    if (!groupe) return introuvable(res, req.params.id);

    const data = pick(req.body, GROUPE_FIELDS);
    const apres = { ...groupe.toJSON(), ...data };

    if ((data.nom_groupe || data.annee_scolaire) && (await nomPris(apres.nom_groupe, apres.annee_scolaire, groupe.id_groupe))) {
        return res.status(409).json({
            message: "Groupe déjà existant",
            error: "Un groupe avec ces caractéristiques existe déjà",
        });
    }
    if ("id_groupe_parent" in data || "type_groupe" in data || "id_filiere" in data) {
        const probleme = await verifierParent(apres, apres.id_groupe_parent);
        if (probleme) return res.status(400).json({ message: "Erreur de validation", error: probleme });
    }

    await groupe.update(data);
    const groupeAJour = await Groupe.findByPk(groupe.id_groupe, { include: INCLUDES });

    res.json({
        message: "Groupe mis à jour avec succès",
        groupe: groupeAJour,
    });
});

// 🗑️ Supprimer un groupe (refusé s'il a des sous-groupes, des séances ou des étudiants)
export const deleteGroupe = asyncHandler(async (req, res) => {
    const groupe = await Groupe.findOne({ where: { id_groupe: req.params.id } });
    if (!groupe) return introuvable(res, req.params.id);

    const [sousGroupes, seances, etudiants] = await Promise.all([
        Groupe.count({ where: { id_groupe_parent: groupe.id_groupe } }),
        Affectation.count({ where: { id_groupe: groupe.id_groupe } }),
        Appartenir.count({ where: { id_groupe: groupe.id_groupe } }),
    ]);
    const raisons = [
        sousGroupes && `${sousGroupes} sous-groupe(s)`,
        seances && `${seances} séance(s)`,
        etudiants && `${etudiants} étudiant(s)`,
    ].filter(Boolean);
    if (raisons.length) {
        return res.status(409).json({
            message: "Groupe utilisé",
            error: `Ce groupe a encore ${raisons.join(", ")} : déplacez-les avant de le supprimer`,
        });
    }

    await groupe.destroy();

    res.json({
        message: "Groupe supprimé avec succès",
    });
});
