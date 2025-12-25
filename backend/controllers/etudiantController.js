import { Etudiant, Users } from "../models/index.js";

/**
 * Contrôleur pour les étudiants
 */

// 🔍 Récupérer tous les étudiants
export const getAllEtudiants = async (req, res) => {
    const etudiants = await Etudiant.findAll({
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    res.json(etudiants);
};

// 🔍 Récupérer un étudiant par ID
export const getEtudiantById = async (req, res) => {
    const etudiant = await Etudiant.findByPk(req.params.id, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    if (!etudiant) {
        return res.status(404).json({ message: "Étudiant non trouvé" });
    }

    res.json(etudiant);
};

// ➕ Créer un étudiant
export const createEtudiant = async (req, res) => {
    const etudiant = await Etudiant.create(req.body);

    const etudiantAvecUser = await Etudiant.findByPk(etudiant.id_user, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    res.status(201).json(etudiantAvecUser);
};

// ✏️ Mettre à jour un étudiant
export const updateEtudiant = async (req, res) => {
    const etudiant = await Etudiant.findByPk(req.params.id);

    if (!etudiant) {
        return res.status(404).json({ message: "Étudiant non trouvé" });
    }

    await etudiant.update(req.body);

    const etudiantAvecUser = await Etudiant.findByPk(etudiant.id_user, {
        include: [
            {
                model: Users,
                as: "user",
                attributes: { exclude: ["password_hash"] },
            },
        ],
    });

    res.json(etudiantAvecUser);
};

// 🗑️ Supprimer un étudiant
export const deleteEtudiant = async (req, res) => {
    const etudiant = await Etudiant.findByPk(req.params.id);

    if (!etudiant) {
        return res.status(404).json({ message: "Étudiant non trouvé" });
    }

    await etudiant.destroy();

    res.json({ message: "Étudiant supprimé avec succès" });
};
