import { Conflit, ConflitAffectation, Affectation } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";

/**
 * Contrôleur pour les conflits
 */

// 🔍 Récupérer tous les conflits (avec pagination)
export const getAllConflits = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    // Filtres optionnels
    const where = {};
    if (req.query.resolu !== undefined) {
        where.resolu = req.query.resolu === "true";
    }
    if (req.query.type_conflit) {
        where.type_conflit = req.query.type_conflit;
    }

    const { count, rows: conflits } = await Conflit.findAndCountAll({
        where,
        include: [
            {
                model: Affectation,
                as: "affectations",
                through: { attributes: [] },
            },
        ],
        limit,
        offset,
        order: [["date_detection", "DESC"]],
    });

    res.json(createPaginationResponse(conflits, count, page, limit));
});

// 🔍 Récupérer un conflit par ID
export const getConflitById = asyncHandler(async (req, res) => {
    const conflit = await Conflit.findByPk(req.params.id, {
        include: [
            {
                model: Affectation,
                as: "affectations",
                through: { attributes: [] },
            },
        ],
    });

    if (!conflit) {
        return res.status(404).json({
            message: "Conflit non trouvé",
            error: `Aucun conflit trouvé avec l'ID ${req.params.id}`,
        });
    }

    res.json(conflit);
});

// ➕ Créer un conflit
export const createConflit = asyncHandler(async (req, res) => {
    const conflit = await Conflit.create(req.body);

    const conflitComplete = await Conflit.findByPk(conflit.id_conflit, {
        include: [
            {
                model: Affectation,
                as: "affectations",
                through: { attributes: [] },
            },
        ],
    });

    res.status(201).json({
        message: "Conflit créé avec succès",
        conflit: conflitComplete,
    });
});

// ✏️ Mettre à jour un conflit
export const updateConflit = asyncHandler(async (req, res) => {
    const conflit = await Conflit.findByPk(req.params.id);

    if (!conflit) {
        return res.status(404).json({
            message: "Conflit non trouvé",
            error: `Aucun conflit trouvé avec l'ID ${req.params.id}`,
        });
    }

    await conflit.update(req.body);

    const conflitComplete = await Conflit.findByPk(conflit.id_conflit, {
        include: [
            {
                model: Affectation,
                as: "affectations",
                through: { attributes: [] },
            },
        ],
    });

    res.json({
        message: "Conflit mis à jour avec succès",
        conflit: conflitComplete,
    });
});

// 🗑️ Supprimer un conflit
export const deleteConflit = asyncHandler(async (req, res) => {
    const conflit = await Conflit.findByPk(req.params.id);

    if (!conflit) {
        return res.status(404).json({
            message: "Conflit non trouvé",
            error: `Aucun conflit trouvé avec l'ID ${req.params.id}`,
        });
    }

    await conflit.destroy();

    res.json({
        message: "Conflit supprimé avec succès",
    });
});

// ➕ Associer une affectation à un conflit
export const associerAffectationAuConflit = asyncHandler(async (req, res) => {
    // Vérifier que le conflit existe
    const conflit = await Conflit.findByPk(req.params.id_conflit);
    if (!conflit) {
        return res.status(404).json({
            message: "Conflit non trouvé",
            error: `Aucun conflit trouvé avec l'ID ${req.params.id_conflit}`,
        });
    }

    // Vérifier que l'affectation existe
    const affectation = await Affectation.findByPk(req.params.id_affectation);
    if (!affectation) {
        return res.status(404).json({
            message: "Affectation non trouvée",
            error: `Aucune affectation trouvée avec l'ID ${req.params.id_affectation}`,
        });
    }

    // Vérifier si l'association existe déjà
    const existing = await ConflitAffectation.findOne({
        where: {
            id_conflit: req.params.id_conflit,
            id_affectation: req.params.id_affectation,
        },
    });
    if (existing) {
        return res.status(409).json({
            message: "Association déjà existante",
            error: "Cette affectation est déjà associée à ce conflit",
        });
    }

    const conflitAffectation = await ConflitAffectation.create({
        id_conflit: req.params.id_conflit,
        id_affectation: req.params.id_affectation,
    });

    res.status(201).json({
        message: "Affectation associée au conflit avec succès",
        association: conflitAffectation,
    });
});

// 🗑️ Dissocier une affectation d'un conflit
export const dissocierAffectationDuConflit = asyncHandler(async (req, res) => {
    const conflitAffectation = await ConflitAffectation.findOne({
        where: {
            id_conflit: req.params.id_conflit,
            id_affectation: req.params.id_affectation,
        },
    });

    if (!conflitAffectation) {
        return res.status(404).json({
            message: "Association non trouvée",
            error: "Cette affectation n'est pas associée à ce conflit",
        });
    }

    await conflitAffectation.destroy();

    res.json({
        message: "Association supprimée avec succès",
    });
});

// 🔍 Récupérer les conflits non résolus (avec pagination)
export const getConflitsNonResolus = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    const { count, rows: conflits } = await Conflit.findAndCountAll({
        where: { resolu: false },
        include: [
            {
                model: Affectation,
                as: "affectations",
                through: { attributes: [] },
            },
        ],
        limit,
        offset,
        order: [["date_detection", "DESC"]],
    });

    res.json(createPaginationResponse(conflits, count, page, limit));
});
