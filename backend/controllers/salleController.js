import { Salle } from "../models/index.js";

/**
 * Contrôleur pour les salles
 */

// 🔍 Récupérer toutes les salles
export const getAllSalles = async (req, res) => {
    const salles = await Salle.findAll();
    res.json(salles);
};

// 🔍 Récupérer une salle par ID
export const getSalleById = async (req, res) => {
    const salle = await Salle.findByPk(req.params.id);

    if (!salle) {
        return res.status(404).json({ message: "Salle non trouvée" });
    }

    res.json(salle);
};

// ➕ Créer une salle
export const createSalle = async (req, res) => {
    const salle = await Salle.create(req.body);
    res.status(201).json(salle);
};

// ✏️ Mettre à jour une salle
export const updateSalle = async (req, res) => {
    const salle = await Salle.findByPk(req.params.id);

    if (!salle) {
        return res.status(404).json({ message: "Salle non trouvée" });
    }

    await salle.update(req.body);
    res.json(salle);
};

// 🗑️ Supprimer une salle
export const deleteSalle = async (req, res) => {
    const salle = await Salle.findByPk(req.params.id);

    if (!salle) {
        return res.status(404).json({ message: "Salle non trouvée" });
    }

    await salle.destroy();
    res.json({ message: "Salle supprimée avec succès" });
};

// 🔍 Récupérer les salles disponibles
export const getSallesDisponibles = async (req, res) => {
    const salles = await Salle.findAll({
        where: { disponible: true },
    });

    res.json(salles);
};
