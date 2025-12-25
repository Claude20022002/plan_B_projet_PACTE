import { Users } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";

/**
 * Contrôleur pour les utilisateurs
 */

// 🔍 Récupérer tous les utilisateurs (avec pagination)
export const getAllUsers = asyncHandler(async (req, res) => {
    const { page, limit, offset } = getPaginationParams(req, 10);

    const { count, rows: users } = await Users.findAndCountAll({
        attributes: { exclude: ["password_hash"] },
        limit,
        offset,
        order: [["created_at", "DESC"]],
    });

    res.json(createPaginationResponse(users, count, page, limit));
});

// 🔍 Récupérer un utilisateur par ID
export const getUserById = asyncHandler(async (req, res) => {
    const user = await Users.findByPk(req.params.id, {
        attributes: { exclude: ["password_hash"] },
    });

    if (!user) {
        return res.status(404).json({
            message: "Utilisateur non trouvé",
            error: `Aucun utilisateur trouvé avec l'ID ${req.params.id}`,
        });
    }

    res.json(user);
});

// ➕ Créer un utilisateur
export const createUser = asyncHandler(async (req, res) => {
    // Vérifier si l'email existe déjà
    const existingUser = await Users.findOne({ where: { email: req.body.email } });
    if (existingUser) {
        return res.status(409).json({
            message: "Email déjà utilisé",
            error: "Un utilisateur avec cet email existe déjà",
        });
    }

    const user = await Users.create(req.body);

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    res.status(201).json({
        message: "Utilisateur créé avec succès",
        user: userResponse,
    });
});

// ✏️ Mettre à jour un utilisateur
export const updateUser = asyncHandler(async (req, res) => {
    const user = await Users.findByPk(req.params.id);

    if (!user) {
        return res.status(404).json({
            message: "Utilisateur non trouvé",
            error: `Aucun utilisateur trouvé avec l'ID ${req.params.id}`,
        });
    }

    // Si l'email est modifié, vérifier qu'il n'existe pas déjà
    if (req.body.email && req.body.email !== user.email) {
        const existingUser = await Users.findOne({ where: { email: req.body.email } });
        if (existingUser) {
            return res.status(409).json({
                message: "Email déjà utilisé",
                error: "Un utilisateur avec cet email existe déjà",
            });
        }
    }

    await user.update(req.body);

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    res.json({
        message: "Utilisateur mis à jour avec succès",
        user: userResponse,
    });
});

// 🗑️ Supprimer un utilisateur
export const deleteUser = asyncHandler(async (req, res) => {
    const user = await Users.findByPk(req.params.id);

    if (!user) {
        return res.status(404).json({
            message: "Utilisateur non trouvé",
            error: `Aucun utilisateur trouvé avec l'ID ${req.params.id}`,
        });
    }

    await user.destroy();

    res.json({
        message: "Utilisateur supprimé avec succès",
    });
});
