import { Salle } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";

/**
 * Contrôleur pour les salles
 */

// 🔍 Récupérer toutes les salles (avec pagination)
export const getAllSalles = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    // Filtres optionnels
    const where = {};
    if (req.query.type_salle) {
        where.type_salle = req.query.type_salle;
    }
    if (req.query.batiment) {
        where.batiment = req.query.batiment;
    }
    if (req.query.disponible !== undefined) {
        where.disponible = req.query.disponible === "true";
    }

    const { count, rows: salles } = await Salle.findAndCountAll({
        where,
        limit,
        offset,
        order: [["nom_salle", "ASC"]],
    });

    res.json(createPaginationResponse(salles, count, page, limit));
});

// 🔍 Récupérer une salle par ID
export const getSalleById = asyncHandler(async (req, res) => {
    const salle = await Salle.findByPk(req.params.id);

    if (!salle) {
        return res.status(404).json({
            message: "Salle non trouvée",
            error: `Aucune salle trouvée avec l'ID ${req.params.id}`,
        });
    }

    res.json(salle);
});

// ➕ Créer une salle
export const createSalle = asyncHandler(async (req, res) => {
    // Vérifier si le nom de salle existe déjà
    const existingSalle = await Salle.findOne({ where: { nom_salle: req.body.nom_salle } });
    if (existingSalle) {
        return res.status(409).json({
            message: "Salle déjà existante",
            error: `Une salle avec le nom "${req.body.nom_salle}" existe déjà`,
        });
    }

    const salle = await Salle.create(req.body);

    res.status(201).json({
        message: "Salle créée avec succès",
        salle,
    });
});

// ✏️ Mettre à jour une salle
export const updateSalle = asyncHandler(async (req, res) => {
    const salle = await Salle.findByPk(req.params.id);

    if (!salle) {
        return res.status(404).json({
            message: "Salle non trouvée",
            error: `Aucune salle trouvée avec l'ID ${req.params.id}`,
        });
    }

    // Si le nom est modifié, vérifier qu'il n'existe pas déjà
    if (req.body.nom_salle && req.body.nom_salle !== salle.nom_salle) {
        const existingSalle = await Salle.findOne({ where: { nom_salle: req.body.nom_salle } });
        if (existingSalle) {
            return res.status(409).json({
                message: "Nom de salle déjà utilisé",
                error: `Une salle avec le nom "${req.body.nom_salle}" existe déjà`,
            });
        }
    }

    await salle.update(req.body);

    res.json({
        message: "Salle mise à jour avec succès",
        salle,
    });
});

// 🗑️ Supprimer une salle
export const deleteSalle = asyncHandler(async (req, res) => {
    const salle = await Salle.findByPk(req.params.id);

    if (!salle) {
        return res.status(404).json({
            message: "Salle non trouvée",
            error: `Aucune salle trouvée avec l'ID ${req.params.id}`,
        });
    }

    await salle.destroy();

    res.json({
        message: "Salle supprimée avec succès",
    });
});

// 🔍 Récupérer les salles disponibles
export const getSallesDisponibles = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    const { count, rows: salles } = await Salle.findAndCountAll({
        where: { disponible: true },
        limit,
        offset,
        order: [["nom_salle", "ASC"]],
    });

    res.json(createPaginationResponse(salles, count, page, limit));
});
