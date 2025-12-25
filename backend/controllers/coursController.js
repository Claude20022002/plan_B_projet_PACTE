import { Cours, Filiere } from "../models/index.js";

/**
 * Contrôleur pour les cours
 */

// 🔍 Récupérer tous les cours
export const getAllCours = async (req, res) => {
    const cours = await Cours.findAll({
        include: [{ model: Filiere, as: "filiere" }],
    });

    res.json(cours);
};

// 🔍 Récupérer un cours par ID
export const getCoursById = async (req, res) => {
    const cours = await Cours.findByPk(req.params.id, {
        include: [{ model: Filiere, as: "filiere" }],
    });

    if (!cours) {
        return res.status(404).json({ message: "Cours non trouvé" });
    }

    res.json(cours);
};

// ➕ Créer un cours
export const createCours = async (req, res) => {
    const cours = await Cours.create(req.body);

    const coursAvecFiliere = await Cours.findByPk(cours.id_cours, {
        include: [{ model: Filiere, as: "filiere" }],
    });

    res.status(201).json(coursAvecFiliere);
};

// ✏️ Mettre à jour un cours
export const updateCours = async (req, res) => {
    const cours = await Cours.findByPk(req.params.id);

    if (!cours) {
        return res.status(404).json({ message: "Cours non trouvé" });
    }

    await cours.update(req.body);

    const coursAvecFiliere = await Cours.findByPk(cours.id_cours, {
        include: [{ model: Filiere, as: "filiere" }],
    });

    res.json(coursAvecFiliere);
};

// 🗑️ Supprimer un cours
export const deleteCours = async (req, res) => {
    const cours = await Cours.findByPk(req.params.id);

    if (!cours) {
        return res.status(404).json({ message: "Cours non trouvé" });
    }

    await cours.destroy();
    res.json({ message: "Cours supprimé avec succès" });
};
