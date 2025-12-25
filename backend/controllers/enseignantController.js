import { Enseignant, Users } from "../models/index.js";

/**
 * Contrôleur pour les enseignants
 */

// 🔍 Récupérer tous les enseignants
export const getAllEnseignants = async (req, res) => {
    const enseignants = await Enseignant.findAll({
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    res.json(enseignants);
};

// 🔍 Récupérer un enseignant par ID
export const getEnseignantById = async (req, res) => {
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
        return res.status(404).json({ message: "Enseignant non trouvé" });
    }

    res.json(enseignant);
};

// ➕ Créer un enseignant
export const createEnseignant = async (req, res) => {
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

    res.status(201).json(enseignantAvecUser);
};

// ✏️ Mettre à jour un enseignant
export const updateEnseignant = async (req, res) => {
    const enseignant = await Enseignant.findByPk(req.params.id);

    if (!enseignant) {
        return res.status(404).json({ message: "Enseignant non trouvé" });
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

    res.json(enseignantAvecUser);
};

// 🗑️ Supprimer un enseignant
export const deleteEnseignant = async (req, res) => {
    const enseignant = await Enseignant.findByPk(req.params.id);

    if (!enseignant) {
        return res.status(404).json({ message: "Enseignant non trouvé" });
    }

    await enseignant.destroy();

    res.json({ message: "Enseignant supprimé avec succès" });
};
