import { Campus, Filiere } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";
import { pick } from "../utils/validationHelper.js";

/**
 * Contrôleur pour les filières
 */

const FILIERE_FIELDS = [
    "code_filiere",
    "nom_filiere",
    "description",
    "regime",
    "ecole",
    "cycle",
    "intitule_cycle",
    "premiere_annee_cycle",
    "id_campus_prefere",
    "partenaire",
    "annees_a_hestim",
];

const INCLUDE_CAMPUS = [{ model: Campus, as: "campus_prefere", attributes: ["id_campus", "code", "nom"] }];

const campusInconnu = async (data) =>
    data.id_campus_prefere !== undefined && data.id_campus_prefere !== null && !(await Campus.findByPk(data.id_campus_prefere));

// 🔍 Récupérer toutes les filières (avec pagination)
export const getAllFilieres = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    const where = {};
    if (req.query.ecole) where.ecole = req.query.ecole;

    const { count, rows: filieres } = await Filiere.findAndCountAll({
        where,
        include: INCLUDE_CAMPUS,
        limit,
        offset,
        order: [["code_filiere", "ASC"]],
    });

    res.json(createPaginationResponse(filieres, count, page, limit));
});

// 🔍 Récupérer une filière par ID
export const getFiliereById = asyncHandler(async (req, res) => {
    const filiere = await Filiere.findOne({ where: { id_filiere: req.params.id }, include: INCLUDE_CAMPUS });

    if (!filiere) {
        return res.status(404).json({
            message: "Filière non trouvée",
            error: `Aucune filière trouvée avec l'ID ${req.params.id}`,
        });
    }

    res.json(filiere);
});

// ➕ Créer une filière
export const createFiliere = asyncHandler(async (req, res) => {
    const data = pick(req.body, FILIERE_FIELDS);

    if (await Filiere.findOne({ where: { code_filiere: data.code_filiere } })) {
        return res.status(409).json({
            message: "Code filière déjà utilisé",
            error: `Une filière avec le code "${data.code_filiere}" existe déjà`,
        });
    }
    if (await campusInconnu(data)) {
        return res.status(400).json({ message: "Erreur de validation", error: "Campus préféré inconnu" });
    }

    const { id_filiere } = await Filiere.create(data);
    const filiere = await Filiere.findByPk(id_filiere, { include: INCLUDE_CAMPUS });

    res.status(201).json({
        message: "Filière créée avec succès",
        filiere,
    });
});

// ✏️ Mettre à jour une filière
export const updateFiliere = asyncHandler(async (req, res) => {
    const filiere = await Filiere.findOne({ where: { id_filiere: req.params.id } });

    if (!filiere) {
        return res.status(404).json({
            message: "Filière non trouvée",
            error: `Aucune filière trouvée avec l'ID ${req.params.id}`,
        });
    }

    const data = pick(req.body, FILIERE_FIELDS);

    // Si le code est modifié, vérifier qu'il n'existe pas déjà
    if (data.code_filiere && data.code_filiere !== filiere.code_filiere) {
        if (await Filiere.findOne({ where: { code_filiere: data.code_filiere } })) {
            return res.status(409).json({
                message: "Code filière déjà utilisé",
                error: `Une filière avec le code "${data.code_filiere}" existe déjà`,
            });
        }
    }
    if (await campusInconnu(data)) {
        return res.status(400).json({ message: "Erreur de validation", error: "Campus préféré inconnu" });
    }

    await filiere.update(data);
    await filiere.reload({ include: INCLUDE_CAMPUS });

    res.json({
        message: "Filière mise à jour avec succès",
        filiere,
    });
});

// 🗑️ Supprimer une filière
export const deleteFiliere = asyncHandler(async (req, res) => {
    const filiere = await Filiere.findOne({ where: { id_filiere: req.params.id } });

    if (!filiere) {
        return res.status(404).json({
            message: "Filière non trouvée",
            error: `Aucune filière trouvée avec l'ID ${req.params.id}`,
        });
    }

    await filiere.destroy();

    res.json({
        message: "Filière supprimée avec succès",
    });
});
