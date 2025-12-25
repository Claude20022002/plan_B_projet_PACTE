import { Cours, Filiere } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";

/**
 * Contrôleur pour les cours
 */

// 🔍 Récupérer tous les cours (avec pagination)
export const getAllCours = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    // Filtres optionnels
    const where = {};
    if (req.query.id_filiere) {
        where.id_filiere = req.query.id_filiere;
    }
    if (req.query.niveau) {
        where.niveau = req.query.niveau;
    }
    if (req.query.semestre) {
        where.semestre = req.query.semestre;
    }

    const { count, rows: cours } = await Cours.findAndCountAll({
        where,
        include: [{ model: Filiere, as: "filiere" }],
        limit,
        offset,
        order: [["code_cours", "ASC"]],
    });

    res.json(createPaginationResponse(cours, count, page, limit));
});

// 🔍 Récupérer un cours par ID
export const getCoursById = asyncHandler(async (req, res) => {
    const cours = await Cours.findByPk(req.params.id, {
        include: [{ model: Filiere, as: "filiere" }],
    });

    if (!cours) {
        return res.status(404).json({
            message: "Cours non trouvé",
            error: `Aucun cours trouvé avec l'ID ${req.params.id}`,
        });
    }

    res.json(cours);
});

// ➕ Créer un cours
export const createCours = asyncHandler(async (req, res) => {
    // Vérifier si le code cours existe déjà
    if (req.body.code_cours) {
        const existingCours = await Cours.findOne({ where: { code_cours: req.body.code_cours } });
        if (existingCours) {
            return res.status(409).json({
                message: "Code cours déjà utilisé",
                error: `Un cours avec le code "${req.body.code_cours}" existe déjà`,
            });
        }
    }

    const cours = await Cours.create(req.body);

    const coursAvecFiliere = await Cours.findByPk(cours.id_cours, {
        include: [{ model: Filiere, as: "filiere" }],
    });

    res.status(201).json({
        message: "Cours créé avec succès",
        cours: coursAvecFiliere,
    });
});

// ✏️ Mettre à jour un cours
export const updateCours = asyncHandler(async (req, res) => {
    const cours = await Cours.findByPk(req.params.id);

    if (!cours) {
        return res.status(404).json({
            message: "Cours non trouvé",
            error: `Aucun cours trouvé avec l'ID ${req.params.id}`,
        });
    }

    // Si le code est modifié, vérifier qu'il n'existe pas déjà
    if (req.body.code_cours && req.body.code_cours !== cours.code_cours) {
        const existingCours = await Cours.findOne({ where: { code_cours: req.body.code_cours } });
        if (existingCours) {
            return res.status(409).json({
                message: "Code cours déjà utilisé",
                error: `Un cours avec le code "${req.body.code_cours}" existe déjà`,
            });
        }
    }

    await cours.update(req.body);

    const coursAvecFiliere = await Cours.findByPk(cours.id_cours, {
        include: [{ model: Filiere, as: "filiere" }],
    });

    res.json({
        message: "Cours mis à jour avec succès",
        cours: coursAvecFiliere,
    });
});

// 🗑️ Supprimer un cours
export const deleteCours = asyncHandler(async (req, res) => {
    const cours = await Cours.findByPk(req.params.id);

    if (!cours) {
        return res.status(404).json({
            message: "Cours non trouvé",
            error: `Aucun cours trouvé avec l'ID ${req.params.id}`,
        });
    }

    await cours.destroy();

    res.json({
        message: "Cours supprimé avec succès",
    });
});
