import { Creneau } from "../models/index.js";

/**
 * Contrôleur pour les créneaux
 */

// 🔍 Récupérer tous les créneaux
export const getAllCreneaux = async (req, res) => {
    const creneaux = await Creneau.findAll();
    res.json(creneaux);
};

// 🔍 Récupérer un créneau par ID
export const getCreneauById = async (req, res) => {
    const creneau = await Creneau.findByPk(req.params.id);

    if (!creneau) {
        return res.status(404).json({ message: "Créneau non trouvé" });
    }

    res.json(creneau);
};

// ➕ Créer un créneau
export const createCreneau = async (req, res) => {
    const creneau = await Creneau.create(req.body);
    res.status(201).json(creneau);
};

// ✏️ Mettre à jour un créneau
export const updateCreneau = async (req, res) => {
    const creneau = await Creneau.findByPk(req.params.id);

    if (!creneau) {
        return res.status(404).json({ message: "Créneau non trouvé" });
    }

    await creneau.update(req.body);
    res.json(creneau);
};

// 🗑️ Supprimer un créneau
export const deleteCreneau = async (req, res) => {
    const creneau = await Creneau.findByPk(req.params.id);

    if (!creneau) {
        return res.status(404).json({ message: "Créneau non trouvé" });
    }

    await creneau.destroy();
    res.json({ message: "Créneau supprimé avec succès" });
};
