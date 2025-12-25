import { Filiere } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";

/**
 * Contrôleur pour les filières
 */

// 🔍 Récupérer toutes les filières (avec pagination)
export const getAllFilieres = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    const { count, rows: filieres } = await Filiere.findAndCountAll({
        limit,
        offset,
        order: [["code_filiere", "ASC"]],
    });

    res.json(createPaginationResponse(filieres, count, page, limit));
});

// 🔍 Récupérer une filière par ID
export const getFiliereById = asyncHandler(async (req, res) => {
    const filiere = await Filiere.findByPk(req.params.id);

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
    // Vérifier si le code filière existe déjà
    if (req.body.code_filiere) {
        const existingFiliere = await Filiere.findOne({
            where: { code_filiere: req.body.code_filiere },
        });
        if (existingFiliere) {
            return res.status(409).json({
                message: "Code filière déjà utilisé",
                error: `Une filière avec le code "${req.body.code_filiere}" existe déjà`,
            });
        }
    }

    const filiere = await Filiere.create(req.body);

    res.status(201).json({
        message: "Filière créée avec succès",
        filiere,
    });
});

// ✏️ Mettre à jour une filière
export const updateFiliere = asyncHandler(async (req, res) => {
    const filiere = await Filiere.findByPk(req.params.id);

    if (!filiere) {
        return res.status(404).json({
            message: "Filière non trouvée",
            error: `Aucune filière trouvée avec l'ID ${req.params.id}`,
        });
    }

    // Si le code est modifié, vérifier qu'il n'existe pas déjà
    if (req.body.code_filiere && req.body.code_filiere !== filiere.code_filiere) {
        const existingFiliere = await Filiere.findOne({
            where: { code_filiere: req.body.code_filiere },
        });
        if (existingFiliere) {
            return res.status(409).json({
                message: "Code filière déjà utilisé",
                error: `Une filière avec le code "${req.body.code_filiere}" existe déjà`,
            });
        }
    }

    await filiere.update(req.body);

    res.json({
        message: "Filière mise à jour avec succès",
        filiere,
    });
});

// 🗑️ Supprimer une filière
export const deleteFiliere = asyncHandler(async (req, res) => {
    const filiere = await Filiere.findByPk(req.params.id);

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
