import { Users } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getPaginationParams, createPaginationResponse } from "../utils/paginationHelper.js";
import { hashPassword } from "../utils/passwordHelper.js";

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
        order: [["id_user", "DESC"]],
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

    // Si un mot de passe est fourni, le hasher
    const updateData = { ...req.body };
    if (updateData.password) {
        updateData.password_hash = await hashPassword(updateData.password);
        delete updateData.password; // Supprimer le champ password non hashé
    }

    await user.update(updateData);

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

// 📥 Importer des utilisateurs en masse
export const importUsers = asyncHandler(async (req, res) => {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({
            message: "Données invalides",
            error: "Un tableau d'utilisateurs est requis",
        });
    }

    const results = {
        success: [],
        errors: [],
    };

    for (const userData of users) {
        try {
            // Vérifier si l'email existe déjà
            const existingUser = await Users.findOne({ where: { email: userData.email } });
            if (existingUser) {
                results.errors.push({
                    email: userData.email,
                    error: "Email déjà utilisé",
                });
                continue;
            }

            // Préparer les données pour la création
            const userCreateData = {
                nom: userData.nom,
                prenom: userData.prenom,
                email: userData.email,
                role: userData.role || 'etudiant',
                telephone: userData.telephone || null,
                actif: userData.actif !== undefined ? userData.actif : true,
            };

            // Hasher le mot de passe si fourni, sinon utiliser le mot de passe par défaut
            const password = userData.password || 'password123';
            userCreateData.password_hash = await hashPassword(password);

            const user = await Users.create(userCreateData);
            const userResponse = user.toJSON();
            delete userResponse.password_hash;
            results.success.push(userResponse);
        } catch (error) {
            console.error(`Erreur lors de la création de l'utilisateur ${userData.email}:`, error);
            results.errors.push({
                email: userData.email || "N/A",
                error: error.message || "Erreur lors de la création",
            });
        }
    }

    res.status(201).json({
        message: `${results.success.length} utilisateur(s) créé(s) avec succès`,
        success: results.success,
        errors: results.errors,
        total: users.length,
        successCount: results.success.length,
        errorCount: results.errors.length,
    });
});
