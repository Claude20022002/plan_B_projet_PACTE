import { Enseignant, Users } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";

/**
 * Contrôleur pour les enseignants
 */

// 🔍 Récupérer tous les enseignants (avec pagination)
export const getAllEnseignants = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    const { count, rows: enseignants } = await Enseignant.findAndCountAll({
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
        limit,
        offset,
        order: [["id_user", "ASC"]],
    });

    res.json(createPaginationResponse(enseignants, count, page, limit));
});

// 🔍 Récupérer un enseignant par ID
export const getEnseignantById = asyncHandler(async (req, res) => {
    const enseignant = await Enseignant.findByPk(req.params.id, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    if (!enseignant) {
        return res.status(404).json({
            message: "Enseignant non trouvé",
            error: `Aucun enseignant trouvé avec l'ID ${req.params.id}`,
        });
    }

    res.json(enseignant);
});

// ➕ Créer un enseignant
export const createEnseignant = asyncHandler(async (req, res) => {
    // Vérifier que l'utilisateur existe
    const user = await Users.findByPk(req.body.id_user);
    if (!user) {
        return res.status(404).json({
            message: "Utilisateur non trouvé",
            error: `Aucun utilisateur trouvé avec l'ID ${req.body.id_user}`,
        });
    }

    // Vérifier que l'utilisateur n'est pas déjà un enseignant
    const existingEnseignant = await Enseignant.findByPk(req.body.id_user);
    if (existingEnseignant) {
        return res.status(409).json({
            message: "Enseignant déjà existant",
            error: `L'utilisateur ${req.body.id_user} est déjà un enseignant`,
        });
    }

    const enseignant = await Enseignant.create(req.body);

    const enseignantAvecUser = await Enseignant.findByPk(enseignant.id_user, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    res.status(201).json({
        message: "Enseignant créé avec succès",
        enseignant: enseignantAvecUser,
    });
});

// ✏️ Mettre à jour un enseignant
export const updateEnseignant = asyncHandler(async (req, res) => {
    const enseignant = await Enseignant.findByPk(req.params.id);

    if (!enseignant) {
        return res.status(404).json({
            message: "Enseignant non trouvé",
            error: `Aucun enseignant trouvé avec l'ID ${req.params.id}`,
        });
    }

    await enseignant.update(req.body);

    const enseignantAvecUser = await Enseignant.findByPk(enseignant.id_user, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    res.json({
        message: "Enseignant mis à jour avec succès",
        enseignant: enseignantAvecUser,
    });
});

// 🗑️ Supprimer un enseignant
export const deleteEnseignant = asyncHandler(async (req, res) => {
    const enseignant = await Enseignant.findByPk(req.params.id);

    if (!enseignant) {
        return res.status(404).json({
            message: "Enseignant non trouvé",
            error: `Aucun enseignant trouvé avec l'ID ${req.params.id}`,
        });
    }

    await enseignant.destroy();

    res.json({
        message: "Enseignant supprimé avec succès",
    });
});
