import { Groupe, Filiere } from "../models/index.js";

/**
 * Contrôleur pour les groupes
 */

// 🔍 Récupérer tous les groupes
export const getAllGroupes = async (req, res) => {
    const groupes = await Groupe.findAll({
        include: [{ model: Filiere, as: "filiere" }],
    });

    res.json(groupes);
};

// 🔍 Récupérer un groupe par ID
export const getGroupeById = async (req, res) => {
    const groupe = await Groupe.findByPk(req.params.id, {
        include: [{ model: Filiere, as: "filiere" }],
    });

    if (!groupe) {
        return res.status(404).json({ message: "Groupe non trouvé" });
    }

    res.json(groupe);
};

// ➕ Créer un groupe
export const createGroupe = async (req, res) => {
    const groupe = await Groupe.create(req.body);

    const groupeAvecFiliere = await Groupe.findByPk(groupe.id_groupe, {
        include: [{ model: Filiere, as: "filiere" }],
    });

    res.status(201).json(groupeAvecFiliere);
};

// ✏️ Mettre à jour un groupe
export const updateGroupe = async (req, res) => {
    const groupe = await Groupe.findByPk(req.params.id);

    if (!groupe) {
        return res.status(404).json({ message: "Groupe non trouvé" });
    }

    await groupe.update(req.body);

    const groupeAvecFiliere = await Groupe.findByPk(groupe.id_groupe, {
        include: [{ model: Filiere, as: "filiere" }],
    });

    res.json(groupeAvecFiliere);
};

// 🗑️ Supprimer un groupe
export const deleteGroupe = async (req, res) => {
    const groupe = await Groupe.findByPk(req.params.id);

    if (!groupe) {
        return res.status(404).json({ message: "Groupe non trouvé" });
    }

    await groupe.destroy();

    res.json({ message: "Groupe supprimé avec succès" });
};
