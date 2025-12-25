import { Filiere } from "../models/index.js";

/**
 * Contrôleur pour les filières
 */

// 🔍 Récupérer toutes les filières
export const getAllFilieres = async (req, res) => {
    const filieres = await Filiere.findAll();
    res.json(filieres);
};

// 🔍 Récupérer une filière par ID
export const getFiliereById = async (req, res) => {
    const filiere = await Filiere.findByPk(req.params.id);

    if (!filiere) {
        return res.status(404).json({ message: "Filière non trouvée" });
    }

    res.json(filiere);
};

// ➕ Créer une filière
export const createFiliere = async (req, res) => {
    const filiere = await Filiere.create(req.body);
    res.status(201).json(filiere);
};

// ✏️ Mettre à jour une filière
export const updateFiliere = async (req, res) => {
    const filiere = await Filiere.findByPk(req.params.id);

    if (!filiere) {
        return res.status(404).json({ message: "Filière non trouvée" });
    }

    await filiere.update(req.body);
    res.json(filiere);
};

// 🗑️ Supprimer une filière
export const deleteFiliere = async (req, res) => {
    const filiere = await Filiere.findByPk(req.params.id);

    if (!filiere) {
        return res.status(404).json({ message: "Filière non trouvée" });
    }

    await filiere.destroy();
    res.json({ message: "Filière supprimée avec succès" });
};
