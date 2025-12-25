import { Users } from "../models/index.js";

/**
 * Contrôleur pour les utilisateurs
 */

// 🔍 Récupérer tous les utilisateurs
export const getAllUsers = async (req, res) => {
    const users = await Users.findAll({
        attributes: { exclude: ["password_hash"] }, // Exclure le mot de passe
    });
    res.json(users);
};

// 🔍 Récupérer un utilisateur par ID
export const getUserById = async (req, res) => {
    const user = await Users.findByPk(req.params.id, {
        attributes: { exclude: ["password_hash"] },
    });

    if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json(user);
};

// ➕ Créer un utilisateur
export const createUser = async (req, res) => {
    const user = await Users.create(req.body);

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    res.status(201).json(userResponse);
};

// ✏️ Mettre à jour un utilisateur
export const updateUser = async (req, res) => {
    const user = await Users.findByPk(req.params.id);

    if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    await user.update(req.body);

    // Retourner l'utilisateur sans le mot de passe
    const userResponse = user.toJSON();
    delete userResponse.password_hash;

    res.json(userResponse);
};

// 🗑️ Supprimer un utilisateur
export const deleteUser = async (req, res) => {
    const user = await Users.findByPk(req.params.id);

    if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    await user.destroy();

    res.json({ message: "Utilisateur supprimé avec succès" });
};
